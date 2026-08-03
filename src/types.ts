export interface Service {
  id: string;
  name: string;
  emoji: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface Master {
  id: string;
  name: string;
  specialization: string;
  initials: string;
  color: string;
  rating: number;
  serviceIds: string[];
}

export interface TimeSlot {
  time: string;
  status: 'available' | 'busy';
}

export type Step = 'service' | 'master' | 'date' | 'time' | 'confirm';

export const STEP_ORDER: Step[] = ['service', 'master', 'date', 'time', 'confirm'];

export interface MyBooking {
  id: number;
  date: string;
  time: string;
  status: 'active' | 'cancelled';
  serviceName: string;
  serviceEmoji: string;
  price: number;
  masterName: string;
}
