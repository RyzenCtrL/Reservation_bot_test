export const SALON_TZ = 'Europe/Moscow';

const DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALON_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const TIME_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: SALON_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function salonTodayISO(): string {
  return DATE_FMT.format(new Date());
}

export function salonNowMinutes(): number {
  const parts = TIME_FMT.formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return h * 60 + m;
}

export function weekdayFromISO(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

export function timeStrToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minToTimeStr(m: number): string {
  const h = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

export function pgTimeToMin(pgTime: string): number {
  const [h, m] = pgTime.split(':').map(Number);
  return h * 60 + m;
}

const RU_DATE_FMT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: SALON_TZ,
  day: 'numeric',
  month: 'long',
});

export function formatSalonDate(dateISO: string): string {
  return RU_DATE_FMT.format(new Date(`${dateISO}T12:00:00Z`));
}
