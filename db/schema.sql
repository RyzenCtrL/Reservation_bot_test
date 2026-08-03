-- Run this once in the Vercel Postgres (Neon) query editor to create the tables.
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  price integer NOT NULL,
  duration_min integer NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS masters (
  id text PRIMARY KEY,
  name text NOT NULL,
  specialization text NOT NULL,
  initials text NOT NULL,
  color text NOT NULL,
  rating numeric(2, 1) NOT NULL DEFAULT 5.0
);

CREATE TABLE IF NOT EXISTS master_services (
  master_id text NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  service_id text NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (master_id, service_id)
);

-- Weekly working hours per master. One row per day the master works;
-- a weekday with no row means the master is off that day.
-- weekday: 0 = Sunday .. 6 = Saturday (matches JS Date#getDay()).
CREATE TABLE IF NOT EXISTS master_schedule (
  master_id text NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  PRIMARY KEY (master_id, weekday)
);

CREATE TABLE IF NOT EXISTS bookings (
  id serial PRIMARY KEY,
  master_id text NOT NULL REFERENCES masters(id),
  service_id text NOT NULL REFERENCES services(id),
  client_telegram_id bigint NOT NULL,
  client_name text,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_id, booking_date, booking_time)
);

-- Snapshot of the service duration at booking time, so slot-overlap checks
-- stay correct even if a service's duration is edited later.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_min integer NOT NULL DEFAULT 30;

-- 'active' | 'cancelled'. Cancelled bookings are kept for history and free
-- up their slot instead of being deleted.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Contact number so the salon can reach the client about this booking.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone text;

CREATE INDEX IF NOT EXISTS bookings_master_date_idx ON bookings (master_id, booking_date);
CREATE INDEX IF NOT EXISTS bookings_client_idx ON bookings (client_telegram_id);
