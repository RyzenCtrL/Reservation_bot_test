import { useLaunchParams } from '@telegram-apps/sdk-react';

export interface TelegramUser {
  id: number;
  name: string;
}

const GUEST: TelegramUser = { id: 0, name: 'Гость (браузер)' };

/**
 * Reads the Telegram user from launch params. Outside of Telegram (plain
 * browser preview) launch params aren't present, so this falls back to a
 * guest identity instead of throwing.
 */
export function useTelegramUser(): TelegramUser {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const launchParams = useLaunchParams(true);
    const user = launchParams.tgWebAppData?.user;
    if (!user) return GUEST;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return { id: user.id, name: fullName || user.username || 'Клиент' };
  } catch {
    return GUEST;
  }
}
