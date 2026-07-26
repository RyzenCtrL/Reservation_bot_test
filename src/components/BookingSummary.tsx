import { motion } from 'framer-motion';
import type { Master, Service, Step } from '../types';
import { formatDateLabel } from '../utils/date';
import { haptics } from '../telegram/haptics';

interface BookingSummaryProps {
  service: Service;
  master: Master;
  dateISO: string;
  time: string;
  confirmed: boolean;
  onEdit: (step: Step) => void;
}

export function BookingSummary({ service, master, dateISO, time, confirmed, onEdit }: BookingSummaryProps) {
  const rows: { label: string; value: string; step: Step }[] = [
    { label: 'Услуга', value: `${service.emoji} ${service.name}`, step: 'service' },
    { label: 'Мастер', value: master.name, step: 'master' },
    { label: 'Дата', value: formatDateLabel(dateISO), step: 'date' },
    { label: 'Время', value: time, step: 'time' },
  ];

  return (
    <div className="px-5 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border bg-surface"
      >
        {rows.map((row, i) => (
          <button
            key={row.label}
            type="button"
            disabled={confirmed}
            onClick={() => {
              haptics.selection();
              onEdit(row.step);
            }}
            className={`flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left disabled:opacity-70 ${
              i !== rows.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <span className="text-sm text-text-muted">{row.label}</span>
            <span className="flex items-center gap-2 font-medium text-text">
              {row.value}
              {!confirmed && <span className="text-xs text-accent">изменить</span>}
            </span>
          </button>
        ))}

        <div className="flex items-center justify-between gap-3 bg-accent-soft px-4 py-4">
          <span className="text-sm text-text-muted">Итого</span>
          <span className="text-lg font-semibold text-text">
            {service.price.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </motion.div>

      <p className="mt-3 text-center text-xs text-text-faint">
        Длительность ~{service.durationMin} мин · оплата в салоне
      </p>
    </div>
  );
}
