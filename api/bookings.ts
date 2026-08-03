import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { validateInitData } from './_lib/initData.js';
import { getAdminChatId, getBotToken, sendTelegramMessage } from './_lib/telegram.js';
import {
  formatSalonDate,
  pgTimeToMin,
  salonNowMinutes,
  salonTodayISO,
  timeStrToMin,
  weekdayFromISO,
} from './_lib/time.js';

interface CreateBookingBody {
  initData?: string;
  masterId?: string;
  serviceId?: string;
  date?: string;
  time?: string;
}

interface CancelBookingBody {
  initData?: string;
  bookingId?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'PATCH') return handleCancel(req, res);

  res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const { initData } = req.query;
  const token = getBotToken();
  const user = token && typeof initData === 'string' ? validateInitData(initData, token) : null;

  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { rows } = await sql`
    SELECT b.id, b.booking_date, to_char(b.booking_time, 'HH24:MI') AS time, b.status,
           s.name AS "serviceName", s.emoji AS "serviceEmoji", s.price,
           m.name AS "masterName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    WHERE b.client_telegram_id = ${user.id}
    ORDER BY b.booking_date DESC, b.booking_time DESC
  `;

  res.status(200).json({
    bookings: rows.map((row) => ({
      id: row.id,
      date: row.booking_date instanceof Date ? row.booking_date.toISOString().slice(0, 10) : row.booking_date,
      time: row.time,
      status: row.status,
      serviceName: row.serviceName,
      serviceEmoji: row.serviceEmoji,
      price: Number(row.price),
      masterName: row.masterName,
    })),
  });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const body = req.body as CreateBookingBody;
  const { initData, masterId, serviceId, date, time } = body;

  if (!masterId || !serviceId || !date || !time || !initData) {
    res.status(400).json({ ok: false, error: 'missing_fields' });
    return;
  }

  const token = getBotToken();
  const user = token ? validateInitData(initData, token) : null;
  if (!user) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const [{ rows: serviceRows }, { rows: masterRows }, { rows: offerRows }] = await Promise.all([
    sql`SELECT name, emoji, price, duration_min FROM services WHERE id = ${serviceId}`,
    sql`SELECT name FROM masters WHERE id = ${masterId}`,
    sql`SELECT 1 FROM master_services WHERE master_id = ${masterId} AND service_id = ${serviceId}`,
  ]);

  if (serviceRows.length === 0) {
    res.status(400).json({ ok: false, error: 'service_not_found' });
    return;
  }
  if (masterRows.length === 0) {
    res.status(400).json({ ok: false, error: 'master_not_found' });
    return;
  }
  if (offerRows.length === 0) {
    res.status(400).json({ ok: false, error: 'master_does_not_offer_service' });
    return;
  }

  const durationMin = serviceRows[0].duration_min as number;
  const startMin = timeStrToMin(time);

  if (date < salonTodayISO() || (date === salonTodayISO() && startMin <= salonNowMinutes())) {
    res.status(400).json({ ok: false, error: 'in_past' });
    return;
  }

  const weekday = weekdayFromISO(date);
  const { rows: scheduleRows } = await sql`
    SELECT start_time, end_time FROM master_schedule
    WHERE master_id = ${masterId} AND weekday = ${weekday}
  `;
  const withinHours =
    scheduleRows.length > 0 &&
    startMin >= pgTimeToMin(scheduleRows[0].start_time as string) &&
    startMin + durationMin <= pgTimeToMin(scheduleRows[0].end_time as string);

  if (!withinHours) {
    res.status(409).json({ ok: false, error: 'outside_hours' });
    return;
  }

  const clientName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Клиент';

  try {
    const { rows } = await sql`
      INSERT INTO bookings (master_id, service_id, booking_date, booking_time, duration_min, client_telegram_id, client_name, status)
      SELECT ${masterId}, ${serviceId}, ${date}::date, ${time}::time, ${durationMin}, ${user.id}, ${clientName}, 'active'
      WHERE NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.master_id = ${masterId}
          AND b.booking_date = ${date}::date
          AND b.status = 'active'
          AND b.booking_time < (${time}::time + make_interval(mins => ${durationMin}))
          AND (b.booking_time + make_interval(mins => b.duration_min)) > ${time}::time
      )
      RETURNING id
    `;

    if (rows.length === 0) {
      res.status(409).json({ ok: false, error: 'slot_taken' });
      return;
    }

    const bookingId = rows[0].id as number;
    const service = serviceRows[0];
    const master = masterRows[0];
    const dateLabel = formatSalonDate(date);
    const priceLabel = `${Number(service.price).toLocaleString('ru-RU')} ₽`;

    if (token) {
      void sendTelegramMessage(
        token,
        user.id,
        [
          '✅ Запись подтверждена!',
          '',
          `${service.emoji} ${service.name}`,
          `👤 Мастер: ${master.name}`,
          `📅 ${dateLabel} в ${time}`,
          `💰 ${priceLabel}`,
          '',
          'Ждём вас в салоне! Отменить запись можно в разделе «Мои записи».',
        ].join('\n'),
      );

      const adminChatId = getAdminChatId();
      if (adminChatId) {
        void sendTelegramMessage(
          token,
          adminChatId,
          [
            '🔔 Новая запись',
            '',
            `👤 Клиент: ${clientName}${user.username ? ` (@${user.username})` : ''}`,
            `${service.emoji} ${service.name}`,
            `🧑‍🎨 Мастер: ${master.name}`,
            `📅 ${dateLabel} в ${time}`,
            `💰 ${priceLabel}`,
          ].join('\n'),
        );
      }
    }

    res.status(201).json({ ok: true, bookingId });
  } catch (err) {
    const pgError = err as { code?: string };
    if (pgError.code === '23505') {
      res.status(409).json({ ok: false, error: 'slot_taken' });
      return;
    }
    console.error('Failed to create booking', err);
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
}

async function handleCancel(req: VercelRequest, res: VercelResponse) {
  const body = req.body as CancelBookingBody;
  const { initData, bookingId } = body;

  if (!initData || !bookingId) {
    res.status(400).json({ ok: false, error: 'missing_fields' });
    return;
  }

  const token = getBotToken();
  const user = token ? validateInitData(initData, token) : null;
  if (!user) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  const { rows } = await sql`
    SELECT b.client_telegram_id AS "clientTelegramId", b.status, b.booking_date, to_char(b.booking_time, 'HH24:MI') AS time,
           s.name AS "serviceName", s.emoji AS "serviceEmoji", m.name AS "masterName"
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    WHERE b.id = ${bookingId}
  `;

  if (rows.length === 0) {
    res.status(404).json({ ok: false, error: 'not_found' });
    return;
  }
  if (rows[0].clientTelegramId !== user.id) {
    res.status(403).json({ ok: false, error: 'forbidden' });
    return;
  }

  if (rows[0].status !== 'cancelled') {
    await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${bookingId}`;

    const adminChatId = token ? getAdminChatId() : undefined;
    if (token && adminChatId) {
      const booking = rows[0];
      void sendTelegramMessage(
        token,
        adminChatId,
        [
          '❌ Запись отменена клиентом',
          '',
          `${booking.serviceEmoji} ${booking.serviceName}`,
          `🧑‍🎨 Мастер: ${booking.masterName}`,
          `📅 ${formatSalonDate(String(booking.booking_date instanceof Date ? booking.booking_date.toISOString().slice(0, 10) : booking.booking_date))} в ${booking.time}`,
        ].join('\n'),
      );
    }
  }

  res.status(200).json({ ok: true });
}
