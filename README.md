# Beauty Booking — Telegram Mini App

A full-stack booking system for a beauty salon, built as a [Telegram Mini App](https://core.telegram.org/bots/webapps). Clients pick a service, master, date and time without leaving Telegram; the salon gets notified and can manage bookings and services from an admin panel inside the same app.

Built end-to-end as a portfolio project: React frontend, serverless API, real Postgres database, and Telegram bot integration — no third-party booking SDKs.

## Features

- **Booking flow** — service → master → date → time → confirm, with animated transitions and haptic feedback.
- **Telegram-native auth** — every write request is verified server-side against Telegram's signed `initData` (HMAC-SHA256), so a request can't be forged with someone else's identity.
- **Duration-aware scheduling** — a 2-hour service blocks every overlapping slot, not just the one it starts in; booking creation is protected by an atomic `INSERT ... WHERE NOT EXISTS` query to prevent race conditions on the same slot.
- **Per-master working hours** — each master has a weekly schedule; days off simply show no slots.
- **Notifications** — clients get a Telegram message confirming their booking; the salon gets notified of new bookings, cancellations, and admin actions.
- **Daily reminders** — a Vercel Cron job messages everyone with a booking tomorrow.
- **My Bookings** — clients can view and cancel their own upcoming bookings.
- **Admin panel** — gated to a single Telegram ID (`ADMIN_TELEGRAM_ID`), verified server-side, not just hidden in the UI:
  - see every upcoming booking with client name/phone, cancel any of them (client gets notified);
  - full CRUD for services (add/edit/delete), no manual SQL required day-to-day.
- **Anti-spam** — a client is capped at a small number of simultaneous active bookings.

## Tech stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v4, Framer Motion, `@telegram-apps/sdk-react`
- **Backend**: Vercel serverless functions (`api/*.ts`), Node.js
- **Database**: Postgres via `@vercel/postgres` (Neon)
- **Bot**: Telegram Bot API webhook (`api/telegram.ts`) for `/start` and the Mini App launch button

## Architecture

```
Telegram client
   │  opens Mini App (signed initData)
   ▼
React app (Vite build, served by Vercel)
   │  fetch('/api/...')
   ▼
Vercel serverless functions (api/*.ts)
   │  validates initData, business rules
   ▼
Postgres (Neon)
```

Every mutating endpoint (`bookings`, `admin/*`) re-validates the Telegram `initData` signature itself — the frontend is never trusted for identity, only for UX.

## Project structure

```
api/
  _lib/           shared server helpers (Telegram send, initData validation, admin check, time/timezone)
  services.ts     public: list services
  masters.ts      public: list masters (optionally filtered by service)
  slots.ts        public: available time slots for a master/service/date
  bookings.ts     GET (my bookings) / POST (create) / PATCH (cancel own)
  admin/
    whoami.ts     is the caller the admin?
    bookings.ts   admin: list all upcoming bookings / cancel any
    services.ts   admin: create/update/delete services
  telegram.ts     bot webhook (/start greeting)
  remind.ts       daily cron: "your booking is tomorrow"
src/
  components/     screen-level UI pieces
  state/          booking flow reducer
  telegram/       Telegram SDK hooks (init, initData, main button, haptics)
  lib/api.ts      typed fetch wrappers for every endpoint
db/
  schema.sql      idempotent — safe to re-run after pulling changes
  seed.sql        starter services/masters/schedule
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Postgres database (e.g. via Vercel Storage → Neon) and run [db/schema.sql](db/schema.sql), then [db/seed.sql](db/seed.sql) in its SQL editor — one statement at a time if your editor doesn't support multi-statement scripts.
3. Set the environment variables below in Vercel (Project → Settings → Environment Variables).
4. Deploy. Vercel builds the frontend and deploys every file in `api/` as its own serverless function automatically; `vercel.json` registers the daily reminder cron.
5. Point your Telegram bot's webhook at `/api/telegram` and its Menu Button / inline keyboard at the deployed URL.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | yes | Bot token from [@BotFather](https://t.me/BotFather); used to send messages and verify `initData`. |
| `MINI_APP_URL` | yes | Deployed URL of this app, sent as the Mini App launch button. |
| `POSTGRES_URL` (and related `POSTGRES_*`) | yes | Provided automatically when you connect a Vercel Postgres/Neon database. |
| `ADMIN_TELEGRAM_ID` | optional | Your numeric Telegram ID (from [@userinfobot](https://t.me/userinfobot)). Enables admin notifications and the admin panel for that ID. |
| `TELEGRAM_WEBHOOK_SECRET` | optional | If set, the webhook rejects requests without this secret token. |
| `CRON_SECRET` | optional | If set, Vercel automatically authenticates its own cron requests with it, so `/api/remind` can't be triggered by anyone else. |

## Local development

`npm run dev` starts the Vite dev server for the frontend only — the `api/*.ts` serverless functions aren't executed by plain Vite, so API calls will 404/fail locally. Test against a real deployment, or use the [Vercel CLI](https://vercel.com/docs/cli) (`vercel dev`) with the environment variables above set locally.
