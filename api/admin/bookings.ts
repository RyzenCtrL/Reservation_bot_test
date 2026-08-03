import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { requireAdmin } from '../_lib/admin.js';
import { getBotToken, sendTelegramMessage } from '../_lib/telegram.js';
import { formatSalonDate, salonTodayISO } from '../_lib/time.js';

interface CancelBody {
  initData?: string;
  bookingId?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBotToken();
  if (!token) {
    res.status(500).json({ error: 'missing_bot_token' });
    return;
  }

  if (req.method === 'GET') return handleList(req, res, token);
  if (req.method === 'PATCH') return handleCancel(req, res, token);

  res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req: VercelRequest, res: VercelResponse, token: string) {
  const { initData } = req.query;
  const admin = requireAdmin(typeof initData === 'string' ? initData : undefined, token);
  if (!admin) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }

  const { rows } = await sql`
    SELECT b.id, b.booking_date, to_char(b.booking_time, 'HH24:MI') AS time,
           b.client_name AS "clientName", b.client_phone AS "clientPhone",
           s.name AS "serviceName", s.emoji AS "serviceEmoji", s.price,
           m.name AS "masterName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    WHERE b.status = 'active' AND b.booking_date >= ${salonTodayISO()}::date
    ORDER BY b.booking_date ASC, b.booking_time ASC
  `;

  res.status(200).json({
    bookings: rows.map((row) => ({
      id: row.id,
      date: row.booking_date instanceof Date ? row.booking_date.toISOString().slice(0, 10) : row.booking_date,
      time: row.time,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      serviceName: row.serviceName,
      serviceEmoji: row.serviceEmoji,
      price: Number(row.price),
      masterName: row.masterName,
    })),
  });
}

async function handleCancel(req: VercelRequest, res: VercelResponse, token: string) {
  const body = req.body as CancelBody;
  const admin = requireAdmin(body.initData, token);
  if (!admin) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  if (!body.bookingId) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const { rows } = await sql`
    SELECT b.client_telegram_id AS "clientTelegramId", b.status, b.booking_date, to_char(b.booking_time, 'HH24:MI') AS time,
           s.name AS "serviceName", s.emoji AS "serviceEmoji", m.name AS "masterName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    WHERE b.id = ${body.bookingId}
  `;

  if (rows.length === 0) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const booking = rows[0];
  if (booking.status !== 'cancelled') {
    await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${body.bookingId}`;

    const dateISO =
      booking.booking_date instanceof Date ? booking.booking_date.toISOString().slice(0, 10) : booking.booking_date;

    void sendTelegramMessage(
      token,
      booking.clientTelegramId as string,
      [
        '❌ Ваша запись отменена салоном',
        '',
        `${booking.serviceEmoji} ${booking.serviceName}`,
        `🧑‍🎨 Мастер: ${booking.masterName}`,
        `📅 ${formatSalonDate(String(dateISO))} в ${booking.time}`,
        '',
        'Свяжитесь с нами, если это неожиданно — запишем на другое время.',
      ].join('\n'),
    );
  }

  res.status(200).json({ ok: true });
}
