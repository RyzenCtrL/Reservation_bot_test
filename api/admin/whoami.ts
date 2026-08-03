import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/admin.js';
import { getBotToken } from '../_lib/telegram.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { initData } = req.query;
  const token = getBotToken();
  const admin = token
    ? requireAdmin(typeof initData === 'string' ? initData : undefined, token)
    : null;

  res.status(200).json({ isAdmin: Boolean(admin) });
}
