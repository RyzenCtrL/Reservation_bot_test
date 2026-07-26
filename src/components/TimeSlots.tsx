import { motion } from 'framer-motion';
import type { TimeSlot } from '../types';
import { haptics } from '../telegram/haptics';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.02 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export function TimeSlots({ slots, selectedTime, onSelect }: TimeSlotsProps) {
  const availableCount = slots.filter((s) => s.status === 'available').length;

  if (availableCount === 0) {
    return (
      <div className="px-5 py-10 text-center text-text-muted">
        На эту дату свободных слотов нет — выберите другой день.
      </div>
    );
  }

  return (
    <motion.div
      variants={list}
      initial="hidden"
      animate="show"
      className="grid grid-cols-3 gap-2.5 px-5 pb-6"
    >
      {slots.map((slot) => {
        const busy = slot.status === 'busy';
        const active = slot.time === selectedTime;

        return (
          <motion.button
            key={slot.time}
            type="button"
            variants={item}
            disabled={busy}
            whileTap={busy ? undefined : { scale: 0.94 }}
            onClick={() => {
              if (busy) return;
              haptics.selection();
              onSelect(slot.time);
            }}
            className={`flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
              busy
                ? 'cursor-not-allowed border-transparent bg-surface/50 text-busy line-through'
                : active
                  ? 'border-accent bg-accent-soft text-text'
                  : 'border-border bg-surface text-text active:bg-surface-2'
            }`}
          >
            {slot.time}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
