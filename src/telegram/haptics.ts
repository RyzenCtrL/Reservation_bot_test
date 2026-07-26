import { hapticFeedback } from '@telegram-apps/sdk-react';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // not running inside Telegram — ignore silently
  }
}

export const haptics = {
  impact(style: ImpactStyle = 'light') {
    safe(() => {
      if (hapticFeedback.impactOccurred.isAvailable()) {
        hapticFeedback.impactOccurred(style);
      }
    });
  },
  notification(type: NotificationType = 'success') {
    safe(() => {
      if (hapticFeedback.notificationOccurred.isAvailable()) {
        hapticFeedback.notificationOccurred(type);
      }
    });
  },
  selection() {
    safe(() => {
      if (hapticFeedback.selectionChanged.isAvailable()) {
        hapticFeedback.selectionChanged();
      }
    });
  },
};
