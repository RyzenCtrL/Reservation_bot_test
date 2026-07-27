-- Run this once in the Vercel Postgres (Neon) query editor to create the tables.

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

CREATE INDEX IF NOT EXISTS bookings_master_date_idx ON bookings (master_id, booking_date);
