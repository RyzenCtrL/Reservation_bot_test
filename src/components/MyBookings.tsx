import { motion } from 'framer-motion';
import type { MyBooking } from '../types';
import { formatDateLabel } from '../utils/date';
import { haptics } from '../telegram/haptics';

interface MyBookingsProps {
  bookings: MyBooking[];
  onCancel: (id: number) => void;
  cancellingId: number | null;
}

export function MyBookings({ bookings, onCancel, cancellingId }: MyBookingsProps) {
  if (bookings.length === 0) {
    return <div className="px-5 py-10 text-center text-text-muted">У вас пока нет записей.</div>;
  }

  return (
    <div className="flex flex-col gap-3 px-5 pb-6">
      {bookings.map((b) => {
        const cancelled = b.status === 'cancelled';
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border border-border bg-surface px-4 py-3 ${cancelled ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-text">
                {b.serviceEmoji} {b.serviceName}
              </span>
              <span className="text-sm font-semibold text-text">{b.price.toLocaleString('ru-RU')} ₽</span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {b.masterName} · {formatDateLabel(b.date)} в {b.time}
            </p>

            {cancelled ? (
              <p className="mt-2 text-xs text-busy">Отменена</p>
            ) : (
              <button
                type="button"
                disabled={cancellingId === b.id}
                onClick={() => {
                  haptics.selection();
                  onCancel(b.id);
                }}
                className="mt-3 flex min-h-[36px] items-center justify-center rounded-xl border border-border px-4 text-xs font-medium text-text-muted active:bg-surface-2 disabled:opacity-50"
              >
                {cancellingId === b.id ? 'Отменяем...' : 'Отменить запись'}
              </button>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
