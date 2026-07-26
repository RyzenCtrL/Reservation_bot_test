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
    <div className="pb-6">
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 pb-1">
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
              className={`flex min-h-[64px] w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors ${
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
