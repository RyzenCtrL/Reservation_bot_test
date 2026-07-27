import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { rows } = await sql`
    SELECT id, name, emoji, price, duration_min AS "durationMin", description
    FROM services
    ORDER BY name
  `;
  res.status(200).json({ services: rows });
}
