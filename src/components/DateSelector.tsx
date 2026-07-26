import { motion } from 'framer-motion';
import { nextDays } from '../utils/date';
import { haptics } from '../telegram/haptics';

interface DateSelectorProps {
  selectedDate: string | null;
  onSelect: (iso: string) => void;
}

const days = nextDays(14);

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  return (
    <div className="min-w-0 pb-6">
      <div
        className="no-scrollbar flex snap-x snap-proximity gap-2.5 overflow-x-auto px-5 pb-1"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
        }}
      >
        {days.map((day) => {
          const active = day.iso === selectedDate;
          return (
            <motion.button
              key={day.iso}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                haptics.selection();
                onSelect(day.iso);
              }}
              className={`flex min-h-[64px] w-14 shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
                active
                  ? 'border-accent bg-accent-soft'
                  : 'border-border bg-surface active:bg-surface-2'
              }`}
            >
              <span className="text-[11px] uppercase text-text-muted">
                {day.isToday ? 'Сег.' : day.weekday}
              </span>
              <span className="text-lg font-semibold text-text">{day.dayNum}</span>
              <span className="text-[11px] text-text-faint">{day.month}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
