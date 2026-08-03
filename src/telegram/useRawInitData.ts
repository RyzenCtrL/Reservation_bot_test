import { useRawInitData as useSdkRawInitData } from '@telegram-apps/sdk-react';

/**
 * Raw, signed initData string used by the server to verify who's booking.
 * Undefined outside of a real Telegram client (plain browser preview) —
 * booking is disabled in that case since there's nothing to verify.
 */
export function useRawInitData(): string | undefined {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSdkRawInitData();
  } catch {
    return undefined;
  }
}
