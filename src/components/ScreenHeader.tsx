import { motion } from 'framer-motion';
import { STEP_ORDER, type Step } from '../types';

interface ScreenHeaderProps {
  step: Step;
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

const STEP_LABELS: Record<Step, string> = {
  service: 'Услуга',
  master: 'Мастер',
  date: 'Дата',
  time: 'Время',
  confirm: 'Готово',
};

export function ScreenHeader({ step, title, subtitle, onBack }: ScreenHeaderProps) {
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="safe-top px-5 pt-4">
      <div className="flex items-center gap-3 mb-4">
        {onBack ? (
          <motion.button
            type="button"
            onClick={onBack}
            whileTap={{ scale: 0.9 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text active:bg-surface-2"
            aria-label="Назад"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        ) : (
          <div className="h-11 w-11 shrink-0" />
        )}

        <div className="flex flex-1 gap-1.5">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                  initial={false}
                  animate={{ width: i <= currentIdx ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Шаг {currentIdx + 1} из {STEP_ORDER.length} · {STEP_LABELS[step]}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-text">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
    </div>
  );
}
