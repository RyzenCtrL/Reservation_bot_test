import { motion } from 'framer-motion';
import type { Master } from '../types';
import { haptics } from '../telegram/haptics';

interface MasterSelectorProps {
  masters: Master[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function MasterSelector({ masters, selectedId, onSelect }: MasterSelectorProps) {
  if (masters.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-text-muted">
        Нет мастеров для этой услуги — попробуйте выбрать другую.
      </div>
    );
  }

  return (
    <motion.div
      variants={list}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 px-5 pb-6"
    >
      {masters.map((master) => {
        const active = master.id === selectedId;
        return (
          <motion.button
            key={master.id}
            type="button"
            variants={item}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              haptics.selection();
              onSelect(master.id);
            }}
            className={`flex min-h-[44px] flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-colors ${
              active
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface active:bg-surface-2'
            }`}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-bg"
              style={{ backgroundColor: master.color }}
            >
              {master.initials}
            </div>
            <p className="font-medium text-text">{master.name}</p>
            <p className="text-xs leading-tight text-text-muted">{master.specialization}</p>
            <div className="flex items-center gap-1 text-xs text-accent">
              <span>★</span>
              <span>{master.rating.toFixed(1)}</span>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
