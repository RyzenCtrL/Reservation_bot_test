import type { AdminBooking, Master, MyBooking, Service, ServiceInput, TimeSlot } from '../types';

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

export function fetchSlots(masterId: string, date: string, serviceId: string): Promise<TimeSlot[]> {
  const query = `masterId=${encodeURIComponent(masterId)}&date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`;
  return getJSON<{ slots: TimeSlot[] }>(`/api/slots?${query}`).then((data) => data.slots);
}

export interface CreateBookingPayload {
  initData: string;
  masterId: string;
  serviceId: string;
  date: string;
  time: string;
  phone: string;
}

export type CreateBookingResult =
  | { ok: true; bookingId: number }
  | {
      ok: false;
      error:
        | 'slot_taken'
        | 'outside_hours'
        | 'in_past'
        | 'unauthorized'
        | 'invalid_phone'
        | 'too_many_bookings'
        | 'internal_error'
        | 'network_error';
    };

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

export function fetchMyBookings(initData: string): Promise<MyBooking[]> {
  return getJSON<{ bookings: MyBooking[] }>(`/api/bookings?initData=${encodeURIComponent(initData)}`).then(
    (data) => data.bookings,
  );
}

export async function cancelBooking(initData: string, bookingId: number): Promise<boolean> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, bookingId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchIsAdmin(initData: string): Promise<boolean> {
  try {
    const data = await getJSON<{ isAdmin: boolean }>(`/api/admin/whoami?initData=${encodeURIComponent(initData)}`);
    return data.isAdmin;
  } catch {
    return false;
  }
}

export function fetchAdminBookings(initData: string): Promise<AdminBooking[]> {
  return getJSON<{ bookings: AdminBooking[] }>(
    `/api/admin/bookings?initData=${encodeURIComponent(initData)}`,
  ).then((data) => data.bookings);
}

export async function cancelAdminBooking(initData: string, bookingId: number): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, bookingId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function fetchAdminServices(initData: string): Promise<Service[]> {
  return getJSON<{ services: Service[] }>(
    `/api/admin/services?initData=${encodeURIComponent(initData)}`,
  ).then((data) => data.services);
}

export type AdminServiceResult = { ok: true } | { ok: false; error: string };

export async function createAdminService(
  initData: string,
  input: ServiceInput,
): Promise<AdminServiceResult> {
  try {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, ...input }),
    });
    const data = await res.json();
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error ?? 'internal_error' };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

export async function updateAdminService(
  initData: string,
  id: string,
  input: ServiceInput,
): Promise<AdminServiceResult> {
  try {
    const res = await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, id, ...input }),
    });
    const data = await res.json();
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error ?? 'internal_error' };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}

export async function deleteAdminService(initData: string, id: string): Promise<AdminServiceResult> {
  try {
    const res = await fetch('/api/admin/services', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, id }),
    });
    const data = await res.json();
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error ?? 'internal_error' };
  } catch {
    return { ok: false, error: 'network_error' };
  }
}
