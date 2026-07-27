import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { serviceId } = req.query;

  const { rows } =
    typeof serviceId === 'string'
      ? await sql`
          SELECT m.id, m.name, m.specialization, m.initials, m.color, m.rating,
                 array_agg(ms2.service_id) AS "serviceIds"
          FROM masters m
          JOIN master_services ms ON ms.master_id = m.id AND ms.service_id = ${serviceId}
          JOIN master_services ms2 ON ms2.master_id = m.id
          GROUP BY m.id
          ORDER BY m.name
        `
      : await sql`
          SELECT m.id, m.name, m.specialization, m.initials, m.color, m.rating,
                 array_agg(ms.service_id) AS "serviceIds"
          FROM masters m
          LEFT JOIN master_services ms ON ms.master_id = m.id
          GROUP BY m.id
          ORDER BY m.name
        `;

  const masters = rows.map((row) => ({ ...row, rating: Number(row.rating) }));

  res.status(200).json({ masters });
}
