import { validateInitData, type ValidatedTelegramUser } from './initData.js';

export function requireAdmin(
  initData: string | undefined,
  token: string,
): ValidatedTelegramUser | null {
  if (!initData) return null;
  const user = validateInitData(initData, token);
  if (!user) return null;

  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId || String(user.id) !== adminId.trim()) return null;

  return user;
}
