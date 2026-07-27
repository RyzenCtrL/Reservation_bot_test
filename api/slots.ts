import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

const SALON_OPEN_MIN = 9 * 60;
const SALON_CLOSE_MIN = 20 * 60 + 30;
const STEP_MIN = 30;

function buildAllSlots(): string[] {
  const slots: string[] = [];
  for (let m = SALON_OPEN_MIN; m <= SALON_CLOSE_MIN; m += STEP_MIN) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${h}:${mm}`);
  }
  return slots;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { masterId, date } = req.query;

  if (typeof masterId !== 'string' || typeof date !== 'string') {
    res.status(400).json({ error: 'masterId and date query params are required' });
    return;
  }

  const { rows } = await sql`
    SELECT to_char(booking_time, 'HH24:MI') AS time
    FROM bookings
    WHERE master_id = ${masterId} AND booking_date = ${date}
  `;
  const booked = new Set(rows.map((row) => row.time as string));

  const slots = buildAllSlots().map((time) => ({
    time,
    status: booked.has(time) ? 'busy' : 'available',
  }));

  res.status(200).json({ slots });
}
