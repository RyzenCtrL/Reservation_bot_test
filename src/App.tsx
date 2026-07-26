import { useMemo, useReducer, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenHeader } from './components/ScreenHeader';
import { ServiceSelector } from './components/ServiceSelector';
import { MasterSelector } from './components/MasterSelector';
import { DateSelector } from './components/DateSelector';
import { TimeSlots } from './components/TimeSlots';
import { BookingSummary } from './components/BookingSummary';
import { ConfirmButton } from './components/ConfirmButton';
import { bookingReducer, initialBookingState } from './state/bookingReducer';
import { MASTERS, SERVICES, getSlotsFor } from './data/mockData';
import { formatDateLabel } from './utils/date';
import { haptics } from './telegram/haptics';
import type { Step } from './types';

const slideVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -24 }),
};

function App() {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const { step, serviceId, masterId, dateISO, time, direction, confirmed } = state;

  const service = useMemo(() => SERVICES.find((s) => s.id === serviceId) ?? null, [serviceId]);

  const availableMasters = useMemo(
    () => (serviceId ? MASTERS.filter((m) => m.serviceIds.includes(serviceId)) : MASTERS),
    [serviceId],
  );

  const master = useMemo(() => MASTERS.find((m) => m.id === masterId) ?? null, [masterId]);

  const slots = useMemo(
    () => (masterId && dateISO ? getSlotsFor(masterId, dateISO) : []),
    [masterId, dateISO],
  );

  const handleEdit = (target: Step) => dispatch({ type: 'GO_TO_STEP', step: target });
  const handleBack = () => dispatch({ type: 'GO_BACK' });

  const handleConfirm = () => {
    if (!service || !master || !dateISO || !time) return;
    console.log('Booking confirmed:', {
      service: service.name,
      master: master.name,
      date: dateISO,
      time,
      price: service.price,
    });
    haptics.notification('success');
    dispatch({ type: 'CONFIRM' });
  };

  const handleRestart = () => {
    haptics.selection();
    dispatch({ type: 'RESET' });
  };

  let content: ReactNode = null;

  switch (step) {
    case 'service':
      content = (
        <>
          <ScreenHeader step={step} title="Выберите услугу" subtitle="Что будем делать сегодня?" />
          <ServiceSelector
            services={SERVICES}
            selectedId={serviceId}
            onSelect={(id) => dispatch({ type: 'SELECT_SERVICE', serviceId: id })}
          />
        </>
      );
      break;

    case 'master':
      content = (
        <>
          <ScreenHeader
            step={step}
            title="Выберите мастера"
            subtitle={service ? `Специалисты по услуге «${service.name}»` : undefined}
            onBack={handleBack}
          />
          <MasterSelector
            masters={availableMasters}
            selectedId={masterId}
            onSelect={(id) => dispatch({ type: 'SELECT_MASTER', masterId: id })}
          />
        </>
      );
      break;

    case 'date':
      content = (
        <>
          <ScreenHeader
            step={step}
            title="Выберите дату"
            subtitle={master ? `Запись к мастеру ${master.name}` : undefined}
            onBack={handleBack}
          />
          <DateSelector
            selectedDate={dateISO}
            onSelect={(iso) => dispatch({ type: 'SELECT_DATE', dateISO: iso })}
          />
        </>
      );
      break;

    case 'time':
      content = (
        <>
          <ScreenHeader
            step={step}
            title="Выберите время"
            subtitle={dateISO ? formatDateLabel(dateISO) : undefined}
            onBack={handleBack}
          />
          <TimeSlots
            slots={slots}
            selectedTime={time}
            onSelect={(t) => dispatch({ type: 'SELECT_TIME', time: t })}
          />
        </>
      );
      break;

    case 'confirm':
      content = confirmed ? (
        <SuccessScreen
          service={service?.name ?? ''}
          master={master?.name ?? ''}
          dateISO={dateISO ?? ''}
          time={time ?? ''}
          onRestart={handleRestart}
        />
      ) : (
        <>
          <ScreenHeader step={step} title="Проверьте детали" subtitle="Всё верно?" onBack={handleBack} />
          {service && master && dateISO && time && (
            <BookingSummary
              service={service}
              master={master}
              dateISO={dateISO}
              time={time}
              confirmed={confirmed}
              onEdit={handleEdit}
            />
          )}
        </>
      );
      break;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step + String(confirmed)}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      {step === 'confirm' && !confirmed && (
        <ConfirmButton
          disabled={!service || !master || !dateISO || !time}
          confirmed={confirmed}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}

interface SuccessScreenProps {
  service: string;
  master: string;
  dateISO: string;
  time: string;
  onRestart: () => void;
}

function SuccessScreen({ service, master, dateISO, time, onRestart }: SuccessScreenProps) {
  return (
    <div className="safe-top flex flex-col items-center px-6 pb-10 pt-16 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.15, 0.95, 1.03, 1], opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-4xl text-bg"
      >
        ✓
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6 text-2xl font-semibold text-text"
      >
        Запись подтверждена!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-2 text-sm text-text-muted"
      >
        {service} · {master}
        <br />
        {formatDateLabel(dateISO)} в {time}
      </motion.p>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        whileTap={{ scale: 0.96 }}
        onClick={onRestart}
        className="mt-10 flex min-h-[44px] items-center justify-center rounded-2xl border border-border bg-surface px-6 text-sm font-medium text-text active:bg-surface-2"
      >
        Записаться ещё раз
      </motion.button>
    </div>
  );
}

export default App;
