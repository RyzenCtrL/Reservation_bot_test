import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

export interface ValidatedTelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

export function validateInitData(raw: string, botToken: string): ValidatedTelegramUser | null {
  const params = new URLSearchParams(raw);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const computedBuf = Buffer.from(computedHash, 'hex');
  const receivedBuf = Buffer.from(hash, 'hex');
  if (computedBuf.length !== receivedBuf.length || !timingSafeEqual(computedBuf, receivedBuf)) {
    return null;
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const userJson = params.get('user');
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    if (typeof user.id !== 'number') return null;
    return {
      id: user.id,
      firstName: user.first_name ?? '',
      lastName: user.last_name,
      username: user.username,
    };
  } catch {
    return null;
  }
}
