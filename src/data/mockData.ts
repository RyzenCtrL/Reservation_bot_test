import type { Master, Service, TimeSlot } from '../types';

export const SERVICES: Service[] = [
  {
    id: 'haircut-women',
    name: 'Женская стрижка',
    emoji: '💇‍♀️',
    price: 2200,
    durationMin: 60,
    description: 'Стрижка любой сложности + укладка',
  },
  {
    id: 'haircut-men',
    name: 'Мужская стрижка',
    emoji: '💈',
    price: 1500,
    durationMin: 45,
    description: 'Стрижка машинкой и ножницами, оформление бороды',
  },
  {
    id: 'coloring',
    name: 'Окрашивание',
    emoji: '🎨',
    price: 4500,
    durationMin: 120,
    description: 'Однотонное окрашивание, тонирование, омбре',
  },
  {
    id: 'manicure',
    name: 'Маникюр',
    emoji: '💅',
    price: 1800,
    durationMin: 90,
    description: 'Классический или аппаратный маникюр с покрытием',
  },
  {
    id: 'pedicure',
    name: 'Педикюр',
    emoji: '🦶',
    price: 2400,
    durationMin: 90,
    description: 'Аппаратный педикюр с покрытием гель-лак',
  },
  {
    id: 'beard',
    name: 'Оформление бороды',
    emoji: '🧔',
    price: 900,
    durationMin: 30,
    description: 'Стрижка и моделирование бороды, горячее полотенце',
  },
  {
    id: 'brows',
    name: 'Брови',
    emoji: '✨',
    price: 1200,
    durationMin: 40,
    description: 'Коррекция формы и окрашивание бровей',
  },
];

export const MASTERS: Master[] = [
  {
    id: 'irina',
    name: 'Ирина',
    specialization: 'Топ-стилист, окрашивание',
    initials: 'ИР',
    color: '#d9a8ff',
    rating: 4.9,
    serviceIds: ['haircut-women', 'coloring', 'brows'],
  },
  {
    id: 'anna',
    name: 'Анна',
    specialization: 'Ногтевой сервис',
    initials: 'АН',
    color: '#ff9fd6',
    rating: 4.8,
    serviceIds: ['manicure', 'pedicure'],
  },
  {
    id: 'maxim',
    name: 'Максим',
    specialization: 'Барбер',
    initials: 'МА',
    color: '#8ec9ff',
    rating: 5.0,
    serviceIds: ['haircut-men', 'beard'],
  },
  {
    id: 'sofia',
    name: 'София',
    specialization: 'Стрижки, укладки',
    initials: 'СО',
    color: '#ffcf8e',
    rating: 4.7,
    serviceIds: ['haircut-women', 'brows'],
  },
  {
    id: 'denis',
    name: 'Денис',
    specialization: 'Барбер, окрашивание',
    initials: 'ДЕ',
    color: '#9fffcf',
    rating: 4.9,
    serviceIds: ['haircut-men', 'beard', 'coloring'],
  },
];

const ALL_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];

/**
 * Deterministic pseudo-random mock: which slots are booked depends on the
 * master + date, so switching between them shows different availability
 * without needing a backend.
 */
export function getSlotsFor(masterId: string, dateISO: string): TimeSlot[] {
  let seed = 0;
  const key = `${masterId}-${dateISO}`;
  for (let i = 0; i < key.length; i++) {
    seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
  }

  return ALL_SLOTS.map((time, i) => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const busy = seed % 5 === 0 || seed % 7 === 0;
    return { time, status: (i < 1 ? 'busy' : busy ? 'busy' : 'available') as TimeSlot['status'] };
  });
}
