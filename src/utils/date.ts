export interface DayOption {
  iso: string;
  dayNum: string;
  weekday: string;
  month: string;
  isToday: boolean;
}

// Dates are always computed in the salon's timezone, not the visitor's
// device timezone — otherwise "today"/available slots would shift for
// anyone browsing from outside Moscow time.
const SALON_TZ = 'Europe/Moscow';

const WEEKDAY_FMT = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: SALON_TZ });
const MONTH_FMT = new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: SALON_TZ });
const ISO_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALON_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function salonTodayISO(): string {
  return ISO_FMT.format(new Date());
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function nextDays(count: number): DayOption[] {
  const todayISO = salonTodayISO();

  return Array.from({ length: count }, (_, i) => {
    const iso = addDaysISO(todayISO, i);
    const anchor = new Date(`${iso}T12:00:00Z`);
    return {
      iso,
      dayNum: String(Number(iso.split('-')[2])),
      weekday: WEEKDAY_FMT.format(anchor).replace('.', ''),
      month: MONTH_FMT.format(anchor).replace('.', ''),
      isToday: i === 0,
    };
  });
}

export function formatDateLabel(iso: string): string {
  const anchor = new Date(`${iso}T12:00:00Z`);
  return `${Number(iso.split('-')[2])} ${MONTH_FMT.format(anchor)}, ${WEEKDAY_FMT.format(anchor)}`;
}
