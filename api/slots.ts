import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import {
  minToTimeStr,
  pgTimeToMin,
  salonNowMinutes,
  salonTodayISO,
  timeStrToMin,
  weekdayFromISO,
} from './_lib/time';

const STEP_MIN = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { masterId, date, serviceId } = req.query;

  if (typeof masterId !== 'string' || typeof date !== 'string' || typeof serviceId !== 'string') {
    res.status(400).json({ error: 'masterId, date and serviceId query params are required' });
    return;
  }

  const { rows: serviceRows } = await sql`
    SELECT duration_min FROM services WHERE id = ${serviceId}
  `;
  if (serviceRows.length === 0) {
    res.status(404).json({ error: 'service_not_found' });
    return;
  }
  const durationMin = serviceRows[0].duration_min as number;

  const weekday = weekdayFromISO(date);
  const { rows: scheduleRows } = await sql`
    SELECT start_time, end_time FROM master_schedule
    WHERE master_id = ${masterId} AND weekday = ${weekday}
  `;
  if (scheduleRows.length === 0) {
    res.status(200).json({ slots: [] });
    return;
  }
  const startMin = pgTimeToMin(scheduleRows[0].start_time as string);
  const endMin = pgTimeToMin(scheduleRows[0].end_time as string);

  const { rows: bookingRows } = await sql`
    SELECT to_char(booking_time, 'HH24:MI') AS time, duration_min
    FROM bookings
    WHERE master_id = ${masterId} AND booking_date = ${date} AND status = 'active'
  `;
  const busyRanges = bookingRows.map((row) => {
    const start = timeStrToMin(row.time as string);
    return [start, start + (row.duration_min as number)] as const;
  });

  const isToday = date === salonTodayISO();
  const nowMin = isToday ? salonNowMinutes() : -1;

  const slots: { time: string; status: 'available' | 'busy' }[] = [];
  for (let m = startMin; m + durationMin <= endMin; m += STEP_MIN) {
    const overlapsBusy = busyRanges.some(([busyStart, busyEnd]) => m < busyEnd && m + durationMin > busyStart);
    const isPast = isToday && m <= nowMin;
    slots.push({ time: minToTimeStr(m), status: overlapsBusy || isPast ? 'busy' : 'available' });
  }

  res.status(200).json({ slots });
}
