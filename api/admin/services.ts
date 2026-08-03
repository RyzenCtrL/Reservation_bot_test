import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { requireAdmin } from '../_lib/admin.js';
import { getBotToken } from '../_lib/telegram.js';

interface ServiceBody {
  initData?: string;
  id?: string;
  name?: string;
  emoji?: string;
  price?: number;
  durationMin?: number;
  description?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getBotToken();
  if (!token) {
    res.status(500).json({ error: 'missing_bot_token' });
    return;
  }

  if (req.method === 'GET') return handleList(req, res, token);
  if (req.method === 'POST') return handleCreate(req, res, token);
  if (req.method === 'PATCH') return handleUpdate(req, res, token);
  if (req.method === 'DELETE') return handleDelete(req, res, token);

  res.status(405).json({ error: 'Method not allowed' });
}

function isAdminOrReject(
  req: VercelRequest,
  res: VercelResponse,
  token: string,
  initDataFromBody?: string,
): boolean {
  const initData =
    initDataFromBody ?? (typeof req.query.initData === 'string' ? req.query.initData : undefined);
  const admin = requireAdmin(initData, token);
  if (!admin) {
    res.status(403).json({ error: 'forbidden' });
    return false;
  }
  return true;
}

function validateFields(body: ServiceBody): string | null {
  if (!body.name || !body.emoji || !body.description) return 'missing_fields';
  if (typeof body.price !== 'number' || body.price <= 0) return 'invalid_price';
  if (typeof body.durationMin !== 'number' || body.durationMin <= 0) return 'invalid_duration';
  return null;
}

async function handleList(req: VercelRequest, res: VercelResponse, token: string) {
  if (!isAdminOrReject(req, res, token)) return;

  const { rows } = await sql`
    SELECT id, name, emoji, price, duration_min AS "durationMin", description
    FROM services
    ORDER BY name
  `;
  res.status(200).json({ services: rows });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, token: string) {
  const body = req.body as ServiceBody;
  if (!isAdminOrReject(req, res, token, body.initData)) return;

  const validationError = validateFields(body);
  if (validationError) {
    res.status(400).json({ ok: false, error: validationError });
    return;
  }

  const id = randomUUID();
  await sql`
    INSERT INTO services (id, name, emoji, price, duration_min, description)
    VALUES (${id}, ${body.name}, ${body.emoji}, ${body.price}, ${body.durationMin}, ${body.description})
  `;

  res.status(201).json({ ok: true, id });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, token: string) {
  const body = req.body as ServiceBody;
  if (!isAdminOrReject(req, res, token, body.initData)) return;

  if (!body.id) {
    res.status(400).json({ ok: false, error: 'missing_fields' });
    return;
  }
  const validationError = validateFields(body);
  if (validationError) {
    res.status(400).json({ ok: false, error: validationError });
    return;
  }

  await sql`
    UPDATE services
    SET name = ${body.name}, emoji = ${body.emoji}, price = ${body.price},
        duration_min = ${body.durationMin}, description = ${body.description}
    WHERE id = ${body.id}
  `;

  res.status(200).json({ ok: true });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, token: string) {
  const body = req.body as ServiceBody;
  if (!isAdminOrReject(req, res, token, body.initData)) return;

  if (!body.id) {
    res.status(400).json({ ok: false, error: 'missing_fields' });
    return;
  }

  try {
    await sql`DELETE FROM services WHERE id = ${body.id}`;
    res.status(200).json({ ok: true });
  } catch (err) {
    const pgError = err as { code?: string };
    if (pgError.code === '23503') {
      res.status(409).json({ ok: false, error: 'has_bookings' });
      return;
    }
    console.error('Failed to delete service', err);
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
}
