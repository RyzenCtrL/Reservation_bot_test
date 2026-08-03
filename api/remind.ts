import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { getBotToken, sendTelegramMessage } from './_lib/telegram';
import { formatSalonDate, salonTodayISO } from './_lib/time';

function tomorrowISO(): string {
  const today = salonTodayISO();
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1, 12));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = getBotToken();
  if (!token) {
    res.status(200).json({ sent: 0, error: 'missing_bot_token' });
    return;
  }

  const date = tomorrowISO();
  const { rows } = await sql`
    SELECT b.client_telegram_id AS "clientTelegramId", to_char(b.booking_time, 'HH24:MI') AS time,
           s.name AS "serviceName", s.emoji AS "serviceEmoji", m.name AS "masterName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    WHERE b.booking_date = ${date}::date AND b.status = 'active'
  `;

  const dateLabel = formatSalonDate(date);

  await Promise.all(
    rows.map((row) =>
      sendTelegramMessage(
        token,
        row.clientTelegramId as number,
        [
          `⏰ Напоминание: завтра, ${dateLabel}, у вас запись`,
          '',
          `${row.serviceEmoji} ${row.serviceName}`,
          `🧑‍🎨 Мастер: ${row.masterName}`,
          `🕐 Время: ${row.time}`,
          '',
          'Ждём вас в салоне!',
        ].join('\n'),
      ),
    ),
  );

  res.status(200).json({ sent: rows.length });
}
