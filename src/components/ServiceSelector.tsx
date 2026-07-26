import { motion } from 'framer-motion';
import type { Service } from '../types';
import { haptics } from '../telegram/haptics';

interface ServiceSelectorProps {
  services: Service[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ServiceSelector({ services, selectedId, onSelect }: ServiceSelectorProps) {
  return (
    <motion.div
      variants={list}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3 px-5 pb-6"
    >
      {services.map((service) => {
        const active = service.id === selectedId;
        return (
          <motion.button
            key={service.id}
            type="button"
            variants={item}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptics.selection();
              onSelect(service.id);
            }}
            className={`flex min-h-[76px] items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors ${
              active
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface active:bg-surface-2'
            }`}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
              {service.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text">{service.name}</p>
              <p className="truncate text-sm text-text-muted">{service.description}</p>
              <p className="mt-0.5 text-xs text-text-faint">{service.durationMin} мин</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-text">{service.price.toLocaleString('ru-RU')} ₽</p>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
