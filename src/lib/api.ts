import type { Master, Service, TimeSlot } from '../types';

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchServices(): Promise<Service[]> {
  return getJSON<{ services: Service[] }>('/api/services').then((data) => data.services);
}

export function fetchMasters(serviceId?: string): Promise<Master[]> {
  const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : '';
  return getJSON<{ masters: Master[] }>(`/api/masters${query}`).then((data) => data.masters);
}

export function fetchSlots(masterId: string, date: string): Promise<TimeSlot[]> {
  const query = `masterId=${encodeURIComponent(masterId)}&date=${encodeURIComponent(date)}`;
  return getJSON<{ slots: TimeSlot[] }>(`/api/slots?${query}`).then((data) => data.slots);
}

export interface CreateBookingPayload {
  masterId: string;
  serviceId: string;
  date: string;
  time: string;
  clientTelegramId: number;
  clientName?: string;
}

export type CreateBookingResult =
  | { ok: true; bookingId: number }
  | { ok: false; error: 'slot_taken' | 'internal_error' | 'network_error' };

export async function createBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) return { ok: true, bookingId: data.bookingId };
    return { ok: false, error: data.error ?? 'internal_error' };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}
