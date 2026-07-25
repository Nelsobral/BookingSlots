# Booking Service

The smart booking platform for beauty professionals — a multi-tenant SaaS that
helps salons, estheticians, massage therapists and hairdressers manage their
bookings, staff, services and clients while reducing no-shows with automated
reminders.

This repository contains **Phase 1**: a complete, production-ready foundation
(auth, multi-tenant data model with RLS, onboarding, and the full business
dashboard). Public booking pages, client portals and email reminders arrive in
Phase 2.

---

## Features (Phase 1)

- 🔐 **Email/password authentication** via Supabase Auth (`@supabase/ssr`)
- 🏢 **Multi-tenant architecture** — every tenant is a `business`, isolated with
  Postgres Row Level Security
- 🧭 **3-step onboarding wizard** to create a business
- 📊 **Dashboard** with upcoming bookings, today's schedule, estimated revenue
  and no-show/cancellation stats
- 📅 **Bookings** management with status workflow (pending → confirmed →
  completed / cancelled / no-show) and filters
- ✂️ **Services** CRUD with per-service color, duration, price and staff
  assignment
- 👥 **Staff** management with availability buffers
- ⚙️ **Settings** — business profile, notification preferences (including a
  configurable sender email per tenant) and cancellation policy
- 🎨 Beautiful, responsive landing page

---

## Tech stack

| Area        | Choice                                   |
| ----------- | ---------------------------------------- |
| Framework   | Next.js 15 (App Router, Server Actions)  |
| Language    | TypeScript (strict mode)                 |
| Styling     | Tailwind CSS v3                          |
| Auth & DB   | Supabase (Postgres) + `@supabase/ssr`    |
| Validation  | Zod                                      |
| Forms       | React Hook Form + `@hookform/resolvers`  |
| Email       | Resend (Phase 2 delivery)                |
| Icons       | lucide-react                             |

---

## Prerequisites

- **Node.js 18.18+** (Node 20+ recommended)
- A **Supabase** project (free tier is fine)
- A **Resend** account + API key (only required for Phase 2 email)

---

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)
3. (Optional, for email confirmations) In **Authentication → URL Configuration**,
   set the Site URL to `http://localhost:3000` and add
   `http://localhost:3000/auth/callback` as a redirect URL.

### Apply the migration

**Option A — Supabase CLI**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — SQL editor**

Open **SQL Editor** in the Supabase dashboard, paste the contents of
`supabase/migrations/001_initial_schema.sql`, and run it.

### Seed demo data (optional)

Paste `supabase/seed.sql` into the SQL editor and run it. This creates:

- 1 business — **Luxe Beauty Studio** (`/book/luxe-beauty`)
- 2 staff — Sophie Laurent, Marcus Chen
- 4 services — Haircut & Style, Deep Tissue Massage, Facial Treatment, Mani/Pedi
- Mon–Sat 9am–6pm availability, 3 clients, 5 upcoming bookings and notification
  preferences

> The seed creates a demo auth user (`owner@luxebeauty.demo`). Set its password
> from **Authentication → Users** in the Supabase dashboard, or remove the
> `auth.users` block if you prefer to sign up manually and reuse the same UUID.

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values.

| Variable                        | Required | Description                                        |
| ------------------------------- | -------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅        | Supabase project URL                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅        | Supabase anon (public) key                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅        | Service role key (server-only, bypasses RLS)       |
| `RESEND_API_KEY`                | ⬜        | Resend API key (Phase 2 email)                     |
| `DEFAULT_FROM_EMAIL`            | ✅        | Default sender email (`Nelsobral@gmail.com`)       |
| `NEXT_PUBLIC_APP_URL`           | ✅        | App base URL (e.g. `http://localhost:3000`)        |

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Add all environment variables from the table above in
   **Project Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain and add
   `<domain>/auth/callback` as a redirect URL in Supabase.
5. Deploy.

---

## Auth flow

1. **Sign up** (`/signup`) creates a Supabase auth user. A `profiles` row is
   created automatically by the `on_auth_user_created` trigger.
2. Supabase sends a confirmation email that links to `/auth/callback`, which
   exchanges the code for a session.
3. **Sign in** (`/login`) authenticates and redirects to `/onboarding` (if the
   user has no business) or `/app/dashboard`.
4. `middleware.ts` refreshes the session on every request and enforces route
   protection:
   - `/app/*` and `/onboarding` require a session
   - `/app/*` additionally requires an active `business_member` (else →
     `/onboarding`)
   - `/login` and `/signup` redirect authenticated users to the dashboard

---

## Tenant isolation (RLS + `business_id` pattern)

Every tenant-scoped table carries a `business_id`. Access is enforced entirely
in the database with Row Level Security:

- `get_user_business_id()` — returns the current user's business id
- `is_business_member(business_id)` — read access for members
- `is_business_owner(business_id)` — write access for owners

Because policies live in Postgres, even a compromised client key cannot read or
write another tenant's data. Server Actions still scope every query by
`business_id` (derived from the authenticated session, never from client input)
as defense in depth.

---

## Reminder workflow (Phase 2)

The schema already models reminders:

- `businesses.reminder_enabled`, `reminder_hours_before`, `reminder_email_from`
- `notification_preferences` per business
- `reminder_events` (channel, status, scheduled/sent timestamps)
- `bookings.reminder_sent_at`

Phase 2 will add a scheduled job (cron / Supabase Edge Function) that finds
bookings due for a reminder, sends email via **Resend** using the tenant's
configured `from_email` (falling back to `DEFAULT_FROM_EMAIL`), and records a
`reminder_events` row.

---

## GitHub workflow

Initial commit & branch strategy:

```bash
git init
git add .
git commit -m "chore: Phase 1 — Booking Service foundation"
git branch -M main
git remote add origin git@github.com:<you>/booking-service.git
git push -u origin main
```

Branch strategy:

- `main` — production, always deployable
- `develop` — integration branch
- `feature/*` — one branch per feature, opened as a PR into `develop`

PR flow: branch from `develop` → open a PR → review + CI → squash-merge into
`develop` → release by merging `develop` into `main`.

---

## Phase 2 roadmap

- `/book/[businessSlug]` — public booking page with real-time availability
- `/client/*` — client portal (manage & cancel appointments)
- Email reminders via Resend + scheduled jobs
- Calendar (week/day) view
- Advanced analytics & reporting
- SMS reminders
- Stripe billing for plan tiers

---

## Project structure

```
app/                Next.js App Router (routes, layouts, API)
components/          UI, dashboard, form and public marketing components
lib/                 Supabase clients, server actions, Zod validations, utils
types/               Database + domain TypeScript types
supabase/            SQL migration + seed data
middleware.ts        Session refresh + route protection
```

---

© Booking Service. Built with Next.js and Supabase.
