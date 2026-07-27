import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

interface BookingBody {
  masterId?: string;
  serviceId?: string;
  date?: string;
  time?: string;
  clientTelegramId?: number;
  clientName?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as BookingBody;
  const { masterId, serviceId, date, time, clientTelegramId, clientName } = body;

  if (!masterId || !serviceId || !date || !time || clientTelegramId === undefined) {
    res.status(400).json({
      error: 'masterId, serviceId, date, time and clientTelegramId are required',
    });
    return;
  }

  try {
    const { rows } = await sql`
      INSERT INTO bookings (master_id, service_id, booking_date, booking_time, client_telegram_id, client_name)
      VALUES (${masterId}, ${serviceId}, ${date}, ${time}, ${clientTelegramId}, ${clientName ?? null})
      RETURNING id
    `;
    res.status(201).json({ ok: true, bookingId: rows[0].id });
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
