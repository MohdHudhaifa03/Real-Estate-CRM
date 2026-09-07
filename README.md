# Aurelia CRM

A small real-estate **sales CRM**: manage leads through a seven-stage pipeline, assign follow-ups, browse projects / buildings / units, and book a unit for a customer without double-booking.

This is the **frontend**. The API lives in [Real-Estate-CRM-backend](https://github.com/MohdHudhaifa03/Real-Estate-CRM-backend).

**Optional preview of an earlier UI build:** [manor-maestro.lovable.app](https://manor-maestro.lovable.app) — run locally against the API for the full product.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Axios.

## How to run (full product)

You need **two terminals**, plus **PostgreSQL**.

### 1. API

```bash
cd Real-Estate-CRM-backend
cp .env.example .env
# set DB_* and JWT_SECRET
pnpm install
pnpm seed
pnpm dev
```

Leave this running on **http://localhost:5000**.

### 2. Website

```bash
cd manor-maestro
# .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
pnpm install
pnpm dev
```

Open **http://localhost:3001**.

### Demo login

Password for all: `demo1234`

- Admin: `layla@aurelia.ae` (all leads, Team page, reassign)
- Sales: `tariq@aurelia.ae` or `zayn@aurelia.ae` (own pipeline only)

The login screen can fill these for you.

## What to click through

1. **Dashboard** — open leads, pipeline value, available units, bookings, **follow-ups due**, upcoming visits.
2. **Leads** — search, filter, pipeline (drag / arrows) and table; add lead; open a lead to edit, set **follow-up date**, add notes, change stage, book a unit. Admins assign owners.
3. **Projects** — buildings and units with price, type, availability; book from the plan or table.
4. **Bookings** — hold → confirm (sold) or cancel (unit free again). Booking a taken unit shows a conflict error.
5. Log in as **sales** and confirm you only see your own leads/bookings.

## Screenshots

Add images here after a local run (dashboard, leads pipeline, project + buildings, booking conflict):

- `docs/dashboard.png`
- `docs/leads.png`
- `docs/project.png`
- `docs/booking.png`

## Important decisions

1. **Sales workspace, not inventory CMS** — Agents create/edit leads and bookings. Projects, buildings, and units are modelled properly in the database and shown in the UI, and loaded from seed so the product is complete rather than half-built admin screens.
2. **Seven stages match the brief** — New → Contacted → Site Visit → Interested → Negotiation → Booked → Lost. Booking a unit moves the lead to **Booked**.
3. **Follow-ups are dates** — Each lead can have a follow-up date; the dashboard lists what is due or overdue, not a vague “needs attention” guess.
4. **Double-booking is a server rule** — The UI only offers available units; the API locks the unit and enforces one active booking per unit so two people cannot reserve the same home.
5. **Roles are real** — Admin sees the team and reassigns. Sales cannot impersonate, cannot assign leads to others, and cannot edit someone else’s records.

## Frontend structure

- `src/app/*` — routes
- `src/components/crm/*` — screens and CRM widgets
- `src/lib/api/*` — Axios client, mappers, endpoints
- `src/lib/crm/store.tsx` — auth + workspace state after login
