import { useEffect, useReducer, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenHeader } from './components/ScreenHeader';
import { ServiceSelector } from './components/ServiceSelector';
import { MasterSelector } from './components/MasterSelector';
import { DateSelector } from './components/DateSelector';
import { TimeSlots } from './components/TimeSlots';
import { BookingSummary } from './components/BookingSummary';
import { ConfirmButton } from './components/ConfirmButton';
import { LoadingState } from './components/LoadingState';
import { bookingReducer, initialBookingState } from './state/bookingReducer';
import { createBooking, fetchMasters, fetchServices, fetchSlots } from './lib/api';
import { formatDateLabel } from './utils/date';
import { haptics } from './telegram/haptics';
import { useTelegramUser } from './telegram/useTelegramUser';
import type { Master, Service, Step, TimeSlot } from './types';

const slideVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -24 }),
};

function App() {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const { step, serviceId, masterId, dateISO, time, direction, confirmed } = state;
  const telegramUser = useTelegramUser();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersLoading, setMastersLoading] = useState(false);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices()
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setMasters([]);
      return;
    }
    setMastersLoading(true);
    fetchMasters(serviceId)
      .then(setMasters)
      .catch(() => setMasters([]))
      .finally(() => setMastersLoading(false));
  }, [serviceId]);

  useEffect(() => {
    if (!masterId || !dateISO) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    fetchSlots(masterId, dateISO)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [masterId, dateISO]);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const master = masters.find((m) => m.id === masterId) ?? null;

  const handleEdit = (target: Step) => dispatch({ type: 'GO_TO_STEP', step: target });
  const handleBack = () => dispatch({ type: 'GO_BACK' });

  const handleSelectTime = (t: string) => {
    setBookingError(null);
    dispatch({ type: 'SELECT_TIME', time: t });
  };

  const handleConfirm = async () => {
    if (!service || !master || !dateISO || !time || submitting) return;

    setSubmitting(true);
    setBookingError(null);

    const result = await createBooking({
      masterId: master.id,
      serviceId: service.id,
      date: dateISO,
      time,
      clientTelegramId: telegramUser.id,
      clientName: telegramUser.name,
    });

    setSubmitting(false);

    if (result.ok) {
      console.log('Booking confirmed:', {
        service: service.name,
        master: master.name,
        date: dateISO,
        time,
        price: service.price,
        bookingId: result.bookingId,
      });
      haptics.notification('success');
      dispatch({ type: 'CONFIRM' });
      return;
    }

    haptics.notification('error');
    if (result.error === 'slot_taken') {
      setBookingError('Этот слот только что заняли — выберите другое время.');
      fetchSlots(master.id, dateISO).then(setSlots);
      dispatch({ type: 'GO_TO_STEP', step: 'time' });
    } else {
      setBookingError('Не получилось создать запись. Попробуйте ещё раз.');
    }
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
          {servicesLoading ? (
            <LoadingState label="Загружаем услуги..." />
          ) : (
            <ServiceSelector
              services={services}
              selectedId={serviceId}
              onSelect={(id) => dispatch({ type: 'SELECT_SERVICE', serviceId: id })}
            />
          )}
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
          {mastersLoading ? (
            <LoadingState label="Ищем мастеров..." />
          ) : (
            <MasterSelector
              masters={masters}
              selectedId={masterId}
              onSelect={(id) => dispatch({ type: 'SELECT_MASTER', masterId: id })}
            />
          )}
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
          {bookingError && (
            <p className="mx-5 mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {bookingError}
            </p>
          )}
          {slotsLoading ? (
            <LoadingState label="Проверяем расписание..." />
          ) : (
            <TimeSlots slots={slots} selectedTime={time} onSelect={handleSelectTime} />
          )}
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
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden">
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step + String(confirmed)}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex min-h-full min-w-0 flex-col"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      {step === 'confirm' && !confirmed && (
        <ConfirmButton
          disabled={!service || !master || !dateISO || !time || submitting}
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
    <div className="safe-top flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
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
