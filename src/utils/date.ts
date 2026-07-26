export interface DayOption {
  iso: string;
  dayNum: string;
  weekday: string;
  month: string;
  isToday: boolean;
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const MONTH_FMT = new Intl.DateTimeFormat('ru-RU', { month: 'short' });

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nextDays(count: number): DayOption[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      iso: toISODate(d),
      dayNum: String(d.getDate()),
      weekday: WEEKDAY_FMT.format(d).replace('.', ''),
      month: MONTH_FMT.format(d).replace('.', ''),
      isToday: i === 0,
    };
  });
}

export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${d} ${MONTH_FMT.format(date)}, ${WEEKDAY_FMT.format(date)}`;
}
