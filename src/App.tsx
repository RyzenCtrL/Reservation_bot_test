import { useCallback, useEffect, useReducer, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScreenHeader } from './components/ScreenHeader';
import { ServiceSelector } from './components/ServiceSelector';
import { MasterSelector } from './components/MasterSelector';
import { DateSelector } from './components/DateSelector';
import { TimeSlots } from './components/TimeSlots';
import { BookingSummary } from './components/BookingSummary';
import { ConfirmButton } from './components/ConfirmButton';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { MyBookings } from './components/MyBookings';
import { AdminBookings } from './components/AdminBookings';
import { AdminServices } from './components/AdminServices';
import { bookingReducer, initialBookingState } from './state/bookingReducer';
import {
  cancelAdminBooking,
  cancelBooking,
  createAdminService,
  createBooking,
  deleteAdminService,
  fetchAdminBookings,
  fetchAdminServices,
  fetchIsAdmin,
  fetchMasters,
  fetchMyBookings,
  fetchServices,
  fetchSlots,
  updateAdminService,
} from './lib/api';
import { formatDateLabel } from './utils/date';
import { haptics } from './telegram/haptics';
import { useRawInitData } from './telegram/useRawInitData';
import type { AdminBooking, Master, MyBooking, Service, ServiceInput, Step, TimeSlot } from './types';

const slideVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -24 }),
};

const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  slot_taken: 'Этот слот только что заняли — выберите другое время.',
  outside_hours: 'Мастер не работает в это время — выберите другой слот.',
  in_past: 'Это время уже прошло — выберите другое.',
  unauthorized: 'Не удалось подтвердить, что это вы. Откройте приложение заново через бота.',
  invalid_phone: 'Проверьте номер телефона.',
  too_many_bookings: 'У вас уже слишком много активных записей. Отмените лишние в разделе «Мои записи».',
};

function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, '').length >= 10;
}

function App() {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const { step, serviceId, masterId, dateISO, time, direction, confirmed } = state;
  const rawInitData = useRawInitData();

  const [mode, setMode] = useState<'booking' | 'my-bookings' | 'admin'>('booking');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<'bookings' | 'services'>('bookings');

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersLoading, setMastersLoading] = useState(false);
  const [mastersError, setMastersError] = useState(false);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [myBookingsError, setMyBookingsError] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [adminBookings, setAdminBookings] = useState<AdminBooking[]>([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);
  const [adminBookingsError, setAdminBookingsError] = useState(false);
  const [adminCancellingId, setAdminCancellingId] = useState<number | null>(null);

  const [adminServices, setAdminServices] = useState<Service[]>([]);
  const [adminServicesLoading, setAdminServicesLoading] = useState(false);
  const [adminServicesError, setAdminServicesError] = useState(false);

  const loadServices = useCallback(() => {
    setServicesLoading(true);
    setServicesError(false);
    fetchServices()
      .then(setServices)
      .catch(() => setServicesError(true))
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(loadServices, [loadServices]);

  const loadMasters = useCallback(() => {
    if (!serviceId) {
      setMasters([]);
      return;
    }
    setMastersLoading(true);
    setMastersError(false);
    fetchMasters(serviceId)
      .then(setMasters)
      .catch(() => setMastersError(true))
      .finally(() => setMastersLoading(false));
  }, [serviceId]);

  useEffect(loadMasters, [loadMasters]);

  const loadSlots = useCallback(() => {
    if (!masterId || !dateISO || !serviceId) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSlotsError(false);
    fetchSlots(masterId, dateISO, serviceId)
      .then(setSlots)
      .catch(() => setSlotsError(true))
      .finally(() => setSlotsLoading(false));
  }, [masterId, dateISO, serviceId]);

  useEffect(loadSlots, [loadSlots]);

  const loadMyBookings = useCallback(() => {
    if (!rawInitData) return;
    setMyBookingsLoading(true);
    setMyBookingsError(false);
    fetchMyBookings(rawInitData)
      .then(setMyBookings)
      .catch(() => setMyBookingsError(true))
      .finally(() => setMyBookingsLoading(false));
  }, [rawInitData]);

  const openMyBookings = () => {
    haptics.selection();
    setMode('my-bookings');
    loadMyBookings();
  };

  const closeMyBookings = () => {
    haptics.selection();
    setMode('booking');
  };

  const handleCancelBooking = async (id: number) => {
    if (!rawInitData || cancellingId !== null) return;
    setCancellingId(id);
    const ok = await cancelBooking(rawInitData, id);
    setCancellingId(null);
    if (ok) {
      haptics.notification('success');
      loadMyBookings();
    } else {
      haptics.notification('error');
    }
  };

  useEffect(() => {
    if (!rawInitData) {
      setIsAdmin(false);
      return;
    }
    fetchIsAdmin(rawInitData).then(setIsAdmin);
  }, [rawInitData]);

  const loadAdminBookings = useCallback(() => {
    if (!rawInitData) return;
    setAdminBookingsLoading(true);
    setAdminBookingsError(false);
    fetchAdminBookings(rawInitData)
      .then(setAdminBookings)
      .catch(() => setAdminBookingsError(true))
      .finally(() => setAdminBookingsLoading(false));
  }, [rawInitData]);

  const loadAdminServices = useCallback(() => {
    if (!rawInitData) return;
    setAdminServicesLoading(true);
    setAdminServicesError(false);
    fetchAdminServices(rawInitData)
      .then(setAdminServices)
      .catch(() => setAdminServicesError(true))
      .finally(() => setAdminServicesLoading(false));
  }, [rawInitData]);

  const openAdmin = () => {
    haptics.selection();
    setMode('admin');
    setAdminTab('bookings');
    loadAdminBookings();
  };

  const closeAdmin = () => {
    haptics.selection();
    setMode('booking');
  };

  const handleAdminTabChange = (tab: 'bookings' | 'services') => {
    haptics.selection();
    setAdminTab(tab);
    if (tab === 'bookings' && adminBookings.length === 0) loadAdminBookings();
    if (tab === 'services' && adminServices.length === 0) loadAdminServices();
  };

  const handleAdminCancelBooking = async (id: number) => {
    if (!rawInitData || adminCancellingId !== null) return;
    setAdminCancellingId(id);
    const ok = await cancelAdminBooking(rawInitData, id);
    setAdminCancellingId(null);
    if (ok) {
      haptics.notification('success');
      loadAdminBookings();
    } else {
      haptics.notification('error');
    }
  };

  const handleCreateService = async (input: ServiceInput) => {
    if (!rawInitData) return { ok: false as const, error: 'unauthorized' };
    const result = await createAdminService(rawInitData, input);
    if (result.ok) loadAdminServices();
    return result;
  };

  const handleUpdateService = async (id: string, input: ServiceInput) => {
    if (!rawInitData) return { ok: false as const, error: 'unauthorized' };
    const result = await updateAdminService(rawInitData, id, input);
    if (result.ok) loadAdminServices();
    return result;
  };

  const handleDeleteService = async (id: string) => {
    if (!rawInitData) return { ok: false as const, error: 'unauthorized' };
    const result = await deleteAdminService(rawInitData, id);
    if (result.ok) loadAdminServices();
    return result;
  };

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

    if (!rawInitData) {
      setBookingError('Не удалось подтвердить, что это вы. Откройте приложение через кнопку в боте.');
      return;
    }

    if (!isValidPhone(phone)) {
      setBookingError(BOOKING_ERROR_MESSAGES.invalid_phone);
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    const result = await createBooking({
      initData: rawInitData,
      masterId: master.id,
      serviceId: service.id,
      date: dateISO,
      time,
      phone: phone.trim(),
    });

    setSubmitting(false);

    if (result.ok) {
      haptics.notification('success');
      dispatch({ type: 'CONFIRM' });
      return;
    }

    haptics.notification('error');
    setBookingError(BOOKING_ERROR_MESSAGES[result.error] ?? 'Не получилось создать запись. Попробуйте ещё раз.');
    if (result.error === 'slot_taken' || result.error === 'outside_hours' || result.error === 'in_past') {
      loadSlots();
      dispatch({ type: 'GO_TO_STEP', step: 'time' });
    }
  };

  const handleRestart = () => {
    haptics.selection();
    setPhone('');
    dispatch({ type: 'RESET' });
  };

  if (mode === 'admin') {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="safe-top px-5 pt-4">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={closeAdmin}
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
              </button>
              <h1 className="text-2xl font-semibold text-text">Админка</h1>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleAdminTabChange('bookings')}
                className={`flex min-h-[36px] flex-1 items-center justify-center rounded-xl border text-sm font-medium ${
                  adminTab === 'bookings'
                    ? 'border-accent bg-accent-soft text-text'
                    : 'border-border text-text-muted active:bg-surface-2'
                }`}
              >
                Записи
              </button>
              <button
                type="button"
                onClick={() => handleAdminTabChange('services')}
                className={`flex min-h-[36px] flex-1 items-center justify-center rounded-xl border text-sm font-medium ${
                  adminTab === 'services'
                    ? 'border-accent bg-accent-soft text-text'
                    : 'border-border text-text-muted active:bg-surface-2'
                }`}
              >
                Услуги
              </button>
            </div>
          </div>

          {adminTab === 'bookings' ? (
            adminBookingsLoading ? (
              <LoadingState label="Загружаем записи..." />
            ) : adminBookingsError ? (
              <ErrorState onRetry={loadAdminBookings} />
            ) : (
              <AdminBookings
                bookings={adminBookings}
                onCancel={handleAdminCancelBooking}
                cancellingId={adminCancellingId}
              />
            )
          ) : adminServicesLoading ? (
            <LoadingState label="Загружаем услуги..." />
          ) : adminServicesError ? (
            <ErrorState onRetry={loadAdminServices} />
          ) : (
            <AdminServices
              services={adminServices}
              onCreate={handleCreateService}
              onUpdate={handleUpdateService}
              onDelete={handleDeleteService}
            />
          )}
        </div>
      </div>
    );
  }

  if (mode === 'my-bookings') {
    return (
      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="safe-top px-5 pt-4">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={closeMyBookings}
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
              </button>
              <h1 className="text-2xl font-semibold text-text">Мои записи</h1>
            </div>
          </div>
          {!rawInitData ? (
            <p className="px-5 py-10 text-center text-text-muted">
              Откройте приложение через кнопку в боте, чтобы увидеть свои записи.
            </p>
          ) : myBookingsLoading ? (
            <LoadingState label="Загружаем записи..." />
          ) : myBookingsError ? (
            <ErrorState onRetry={loadMyBookings} />
          ) : (
            <MyBookings bookings={myBookings} onCancel={handleCancelBooking} cancellingId={cancellingId} />
          )}
        </div>
      </div>
    );
  }

  let content: ReactNode = null;

  switch (step) {
    case 'service':
      content = (
        <>
          <ScreenHeader step={step} title="Выберите услугу" subtitle="Что будем делать сегодня?" />
          <div className="-mt-2 flex gap-4 px-5 pb-2">
            <button type="button" onClick={openMyBookings} className="text-sm font-medium text-accent">
              Мои записи →
            </button>
            {isAdmin && (
              <button type="button" onClick={openAdmin} className="text-sm font-medium text-accent">
                ⚙️ Админка
              </button>
            )}
          </div>
          {servicesLoading ? (
            <LoadingState label="Загружаем услуги..." />
          ) : servicesError ? (
            <ErrorState onRetry={loadServices} />
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
          ) : mastersError ? (
            <ErrorState onRetry={loadMasters} />
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
          ) : slotsError ? (
            <ErrorState onRetry={loadSlots} />
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
          {bookingError && (
            <p className="mx-5 mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {bookingError}
            </p>
          )}
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
          <div className="px-5 pb-6">
            <label className="mb-1.5 block text-sm text-text-muted" htmlFor="client-phone">
              Телефон для связи
            </label>
            <input
              id="client-phone"
              type="tel"
              inputMode="tel"
              placeholder="+7 900 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
            />
          </div>
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
          disabled={!service || !master || !dateISO || !time || !isValidPhone(phone) || submitting}
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
