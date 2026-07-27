import { AnimatePresence, motion } from 'framer-motion';
import { useMainButton } from '../telegram/useMainButton';
import { haptics } from '../telegram/haptics';

interface ConfirmButtonProps {
  disabled?: boolean;
  confirmed: boolean;
  onConfirm: () => void;
}

export function ConfirmButton({ disabled = false, confirmed, onConfirm }: ConfirmButtonProps) {
  const handleConfirm = () => {
    if (disabled || confirmed) return;
    haptics.notification('success');
    onConfirm();
  };

  // Telegram's native MainButton renders in its own theme color (usually
  // blue), which clashes with the app's pink/lavender palette and duplicates
  // our in-page button. Keep it hidden and use only the custom button below.
  useMainButton({
    text: confirmed ? 'Запись подтверждена' : 'Подтвердить запись',
    visible: false,
    enabled: !disabled && !confirmed,
    onClick: handleConfirm,
  });

  return (
    <div className="safe-bottom safe-x sticky bottom-0 border-t border-border bg-bg/80 px-5 pb-4 pt-3 backdrop-blur">
      <motion.button
        type="button"
        disabled={disabled || confirmed}
        onClick={handleConfirm}
        whileTap={disabled || confirmed ? undefined : { scale: 0.96 }}
        animate={confirmed ? { scale: [1, 1.1, 0.96, 1.03, 1] } : { scale: 1 }}
        transition={confirmed ? { duration: 0.65, ease: 'easeInOut' } : { duration: 0.15 }}
        className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold transition-colors ${
          confirmed
            ? 'bg-success text-bg'
            : disabled
              ? 'bg-surface-2 text-text-faint'
              : 'bg-gradient-to-r from-accent to-accent-2 text-bg'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {confirmed ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ✓ Запись подтверждена
            </motion.span>
          ) : (
            <motion.span
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Подтвердить запись
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
