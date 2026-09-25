# Plotline — Real Estate CRM

A small CRM for a real estate sales team: capture leads, work them through the sales pipeline, browse live unit inventory, and book units without two people ever selling the same flat.

**Live demo:** `https://real-estate-crm-seven-chi.vercel.app/` (see [Deployment](#deployment))
**API:** `https://real-estate-crm-foy5.onrender.com/`

| Role | Email | Password | Lands on |
| --- | --- | --- | --- |
| Admin | `admin@plotline.dev` | `Admin@123` | `/admin` |
| Sales employee | `arjun@plotline.dev` | `Sales@123` | `/sales` |
| Sales employee | `priya@plotline.dev`, `rahul@plotline.dev` | `Sales@123` | `/sales` |

The login page also has one-click demo buttons for both roles.

---

## Contents

1. [What's inside](#whats-inside)
2. [Tech stack](#tech-stack)
3. [Run it locally](#run-it-locally)
4. [Deployment](#deployment)
5. [Key decisions](#key-decisions)
6. [Database overview](#database-overview)
7. [API overview](#api-overview)
8. [Business rules](#business-rules)
9. [Project structure](#project-structure)
10. [Known limitations](#known-limitations)

---

## What's inside

The app has two portals with their own URLs, navigation and look. Both are served by the same Next.js app and the same API; the API decides what each role may see and do.

**Admin console — `/admin`** (blue accent, dark sidebar)

- Dashboard: open leads, follow-ups due today/overdue, bookings and sales value this month, pipeline by stage, team performance (credited to each booking's sales owner), recent bookings, inventory snapshot. Links jump straight to **unassigned leads** and open leads with **no follow-up** — the ones that quietly go cold.
- Leads: every lead in the company, search by name/phone/email, filter by stage, source, owner and follow-up status, create/edit, assign or reassign to a sales employee.
- Properties: projects → buildings → units. Add projects and buildings, add single units or generate a whole building (floors × units per floor, with per-floor price rise), change price/type/status, block units.
- Bookings: all bookings with search and status filter; admins can cancel a booking, which frees the unit, and can book with discounts above the sales limit on a rep's behalf.
- Team: add sales employees or admins, edit, deactivate/reactivate.

**Sales workspace — `/sales`** (brass accent, light sidebar)

- My day: personal follow-ups (overdue first), my pipeline, my bookings this month, win rate.
- My leads: only leads assigned to me. Add leads, log notes (the first note on a New lead moves it to Contacted), set the next follow-up (quick picks: tomorrow, in 3 days, next week), move stages, mark as lost with a reason.
- Inventory: a building-elevation view of every tower — each floor is a row, each flat a cell coloured by availability. Tap a unit to see details and book it for one of my leads. The booking form shows the discount and booking-amount limits up front.
- Bookings: my bookings.

**Everywhere:** loading skeletons, empty states with a next action, error states with retry, inline form validation (client and server), toast feedback, light/dark/system theme, responsive layout with a mobile drawer, URL-synced filters (shareable, back-button friendly), and Motion animations on buttons, page transitions, the sidebar indicator, counters, pipeline bars and the login illustration. Animations respect `prefers-reduced-motion`.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (Pages Router), React 19, Tailwind CSS v4, shadcn/ui (Radix primitives), Motion (`motion/react`), lucide icons, sonner toasts |
| State | React Context for auth and theme; small hooks (`useFetch`, `useUrlFilters`, `useForm`, `useDebounce`) for data and forms |
| API calls | One `api` client using `fetch` with `async/await` + `try/catch`, typed `ApiError` carrying field errors, automatic sign-out on 401 |
| Backend | Node.js 20+, Express 5, Mongoose 9, Zod 4 validation, JWT auth, bcrypt, helmet, CORS, rate-limited login |
| Database | MongoDB Atlas (free M0 cluster) |
| Hosting | Vercel (free) for both the client and the API (API runs as a serverless function) |

---

## Run it locally

**Requirements:** Node.js 20 or newer, and a MongoDB connection string (a free Atlas cluster works; a local `mongod` works too).

### 1. API

```bash
cd server
npm install
cp .env.example .env          # then fill in MONGODB_URI and JWT_SECRET
npm run seed                  # creates demo users, 3 projects, 146 units, 28 leads, 4 bookings
npm run dev                   # http://localhost:5000
```

`npm run seed` wipes and recreates all collections, so only run it against a database you're happy to reset.

### 2. Client

```bash
cd client
npm install
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                   # http://localhost:3000
```

Open http://localhost:3000 and use a demo account.

### Environment variables

| App | Variable | Example | Notes |
| --- | --- | --- | --- |
| server | `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/estate-crm?retryWrites=true&w=majority` | Required. The path segment (`estate-crm`) is the database name. |
| server | `JWT_SECRET` | 64+ random characters | Required. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| server | `JWT_EXPIRES_IN` | `7d` | Optional. |
| server | `CLIENT_URL` | `https://plotline.vercel.app` | Allowed CORS origin(s), comma separated. |
| server | `PORT` | `5000` | Local only. |
| client | `NEXT_PUBLIC_API_URL` | `https://plotline-api.vercel.app` | API base URL, no trailing slash. |

---

## Deployment

Everything runs on free tiers: MongoDB Atlas M0 for the database and two Vercel projects (one for the API, one for the client) created from the same GitHub repository.

### Step 1 — MongoDB Atlas

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create an **M0 (free)** cluster.
2. **Database Access** → add a database user with a password (role: *Read and write to any database*).
3. **Network Access** → add `0.0.0.0/0`. Vercel functions don't have fixed IP addresses, so the cluster has to accept any IP; access is still protected by the username/password.
4. **Connect → Drivers** → copy the connection string, insert your password, and add the database name before the `?`: `...mongodb.net/estate-crm?retryWrites=true&w=majority`.
5. Seed it from your machine:
   ```bash
   cd server
   # put the Atlas URI in server/.env
   npm install && npm run seed
   ```

### Step 2 — Push to GitHub

Push the whole folder (with `client/` and `server/`) to a GitHub repository. `.env` files and `node_modules` are git-ignored.

### Step 3 — Deploy the API on Vercel

1. Vercel → **Add New → Project** → import the repository.
2. **Root Directory:** `server`
3. **Framework Preset:** `Other` (if Vercel auto-selects *Express*, switch it to *Other*). Leave build and output settings empty.
4. **Environment Variables:**
   - `MONGODB_URI` = your Atlas string
   - `JWT_SECRET` = a long random string
   - `CLIENT_URL` = `http://localhost:3000` for now (updated in step 5)
5. Deploy, then open `https://<your-api>.vercel.app/api/health` — you should see `{"status":"ok",...}`.

`server/api/index.js` exports the Express app as a serverless function and `server/vercel.json` routes every path to it. The database connection is cached across warm invocations (`src/config/db.js`).

### Step 4 — Deploy the client on Vercel

1. **Add New → Project** → import the same repository again.
2. **Root Directory:** `client` (Framework Preset: *Next.js* is detected automatically).
3. **Environment Variables:** `NEXT_PUBLIC_API_URL` = `https://<your-api>.vercel.app` (no trailing slash).
4. Deploy.

### Step 5 — Connect the two

In the **API** project → Settings → Environment Variables, set `CLIENT_URL` to your client URL, e.g. `https://<your-client>.vercel.app` (add more origins separated by commas if you use preview URLs or a custom domain). Then **Deployments → Redeploy** so the new value takes effect.

Open the client URL, sign in with a demo account — that's the live URL for the submission.

### Alternative: API on Render

The API also runs as a normal Node server: on [Render](https://render.com), create a *Web Service* with root directory `server`, build command `npm install`, start command `npm start`, and the same environment variables. Note that Render's free tier sleeps after inactivity, so the first request can take ~50 seconds; that's why Vercel is the default here.

---

## Key decisions

### 1. Double booking is prevented by the database, not by a check-then-write

Checking "is the unit available?" and then saving a booking leaves a gap where two requests can both pass the check. Instead:

- **Atomic claim.** The booking service flips the unit with a single conditional update: `Unit.findOneAndUpdate({ _id, status: 'available' }, { status: 'booked' })`. MongoDB applies this atomically, so if two people press *Confirm* at the same moment, exactly one update matches and the other gets `null` → **409 "This unit was just booked by someone else"**.
- **Unique index as a safety net.** `bookings` has a partial unique index on `{ unit: 1 }` for `status: 'confirmed'`, so the database itself refuses a second confirmed booking for a unit, whatever code path tries it. Cancelled bookings are excluded, so history is kept and the unit can be re-sold.
- **Compensation.** If saving the booking fails after the unit was claimed, the unit is released again so it isn't stuck as "booked" with no booking.

Tested by firing 5 concurrent booking requests for one unit: one `201`, four `409`. On a `409` the UI refreshes the unit list and tells the user to pick another unit.

A multi-document transaction would also work, but the conditional update + unique index gives the same guarantee with fewer moving parts and works on any MongoDB deployment.

### 2. Two portals, one source of truth for permissions

Admins and sales employees get different URLs (`/admin/*`, `/sales/*`), navigation, dashboards and accent colours, because their jobs differ: admins oversee the whole pipeline and inventory; sales people need "who do I call today". The client redirects a user who opens the other role's portal, but that's convenience only — **every rule is enforced by the API**:

- Sales employees only ever query their own leads (`assignedTo = me` is added on the server). Requesting someone else's lead returns **404, not 403**, so IDs can't be probed to learn which leads exist.
- Assigning leads, cancelling bookings, changing inventory and managing the team are admin-only (`authorize('admin')` middleware).
- Leads can only be owned by **active sales employees**. Deactivating someone, or moving them from sales to admin, sends their open leads back to **Unassigned** so nothing is left with a person who can't follow up.
- The user is re-loaded from the database on every request, so deactivating someone locks them out immediately rather than when their token expires.
- On booked units, sales employees see that the unit is booked but not who the customer is, unless it's their own lead.

### 3. "Booked" is an outcome, not a dropdown option

A lead reaches **Booked** only through the booking flow, which links the lead to a specific unit at an agreed price. Picking "Booked" from the stage control isn't possible, so the pipeline can never claim a sale that has no unit behind it. The reverse is also consistent: when an admin cancels a booking, the unit becomes available again and the lead goes back to **Negotiation** (unless it still holds another confirmed booking). **Lost** requires a reason (with quick-pick reasons in the UI) and clears the follow-up; a lost lead can be reopened by choosing a stage.

The rest of the pipeline follows the same idea — stages reflect what actually happened:

- **New means untouched.** Logging the first interaction on a New lead moves it to **Contacted** (recorded in the timeline), and a lead can't be moved back to New.
- **Every sale has an owner.** Each booking stores a `salesOwner` — the lead's sales employee at the time of booking — separately from `bookedBy`. An admin may book on a rep's behalf, and the rep still gets the credit in team performance; reassigning the lead later doesn't move it. An unassigned lead has to be assigned before it can be booked.
- **Pricing guardrails.** Sales employees can agree a price up to **5% below list**; bigger discounts need an admin, who books the deal. The booking amount is capped at **10% of the agreed price**, because RERA (section 13) doesn't let a developer take more than that before a registered agreement for sale. Both limits are shown in the booking form and enforced by the API.

### 4. Follow-ups are computed in the user's time zone

The API runs in UTC on Vercel, while the team works in IST. "Due today" computed on the server would flip at 5:30 am India time. The client sends its offset in an `X-TZ-Offset` header and the API uses it to compute "today", "overdue" and "upcoming" for the dashboards and filters. Follow-up dates must be in the future, and can't be set on Booked or Lost leads.

### 5. Nothing important is deleted

Real estate records are the kind of data people ask about months later, so there are no hard deletes:

- Every change to a lead (created, edited, note, stage change, reassignment, booking, cancellation) writes an `activities` entry, shown as the lead's timeline.
- Units are **blocked** instead of deleted; bookings are **cancelled** (with reason, who, when) instead of deleted.
- Each booking stores the **agreed price** at the time of booking, so later price changes on the unit don't rewrite what the customer agreed to.
- Deactivating a sales employee (or moving them out of sales) moves their open leads to **Unassigned** so an admin can redistribute them; closed leads keep their owner for reporting.
- A **booked unit is read-only** — type, area, price and status can't change while a customer holds it. Cancel the booking first.
- Duplicate leads are blocked by phone number (normalised: spaces, `+91` and leading `0` removed) with a unique index; the error names who already owns the lead.

---

## Database overview

Seven collections. References are `ObjectId`s resolved with `populate`.

```mermaid
erDiagram
    USER ||--o{ LEAD : "is assigned"
    USER ||--o{ BOOKING : "books / owns sale"
    LEAD ||--o{ ACTIVITY : "has timeline"
    LEAD ||--o{ BOOKING : "has"
    PROJECT ||--o{ BUILDING : "contains"
    BUILDING ||--o{ UNIT : "contains"
    PROJECT ||--o{ UNIT : "denormalised ref"
    UNIT ||--o| BOOKING : "at most one confirmed"
```

| Collection | Key fields | Indexes |
| --- | --- | --- |
| `users` | name, email, password (bcrypt, never selected by default), role `admin`/`sales`, isActive | unique email |
| `leads` | name, phone (normalised digits), email, source, budget, preferredUnitType, stage, lostReason, assignedTo → users, nextFollowUpAt, lastContactedAt, createdBy | unique phone; `{assignedTo, stage}`; `nextFollowUpAt`; `createdAt` |
| `activities` | lead → leads, type (`created`, `note`, `stage_change`, `assignment`, `booking`, `booking_cancelled`, `updated`), message, meta, createdBy | `{lead, createdAt}` |
| `projects` | name, city, location, description, status | unique name |
| `buildings` | project → projects, name, totalFloors | unique `{project, name}` |
| `units` | project, building, unitNumber, floor, type (1–4BHK, Villa, Plot, Commercial), areaSqft, price, status `available`/`booked`/`blocked` | unique `{building, unitNumber}`; `{project, status}` |
| `bookings` | lead, unit, project, agreedPrice, bookingAmount, notes, status `confirmed`/`cancelled`, bookedBy (who clicked Book), salesOwner (who gets the credit), cancelReason, cancelledBy, cancelledAt | **partial unique `{unit}` where status = confirmed**; `lead`; `{salesOwner, status}`; `createdAt` |

`units.project` duplicates what's reachable through `building` on purpose: inventory screens filter units by project constantly, and this avoids a join on every request.

---

## API overview

Base URL: `/api`. All endpoints except login and health need `Authorization: Bearer <token>`. Errors share one shape: `{ "message": "...", "details": [{ "field": "phone", "message": "..." }] }` (`details` only on validation errors), with 400 (validation), 401, 403, 404, 409 (conflict/duplicate) status codes.

| Method | Endpoint | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | Email + password → `{ token, user }` (rate limited) |
| GET | `/auth/me` | any | Current user |
| GET | `/health` | public | Health check |
| GET | `/dashboard` | any | Role-aware summary (company-wide for admin, personal for sales), incl. unassigned and no-follow-up counts |
| GET | `/leads` | any | List with `q`, `stage`, `source`, `assignedTo`, `followUp` (`today`/`overdue`/`upcoming`/`none`), `sort`, `page`, `limit`; returns per-stage counts |
| POST | `/leads` | any | Create (sales-created leads are assigned to the creator) |
| GET | `/leads/:id` | any* | Lead with activity timeline and bookings |
| PATCH | `/leads/:id` | any* | Edit contact details, budget, preferences, follow-up |
| PATCH | `/leads/:id/stage` | any* | Change stage (`reason` required for Lost; Booked not allowed) |
| PATCH | `/leads/:id/assign` | admin | Assign / reassign / unassign |
| POST | `/leads/:id/notes` | any* | Add a note, optionally setting the next follow-up |
| GET | `/projects` | any | Projects with unit counts by status and starting price |
| POST | `/projects` | admin | Create project |
| GET | `/projects/:id` | any | Project with buildings and inventory counts |
| PATCH | `/projects/:id` | admin | Edit project |
| POST | `/projects/:id/buildings` | admin | Add building |
| PATCH | `/buildings/:id` | admin | Edit building |
| POST | `/buildings/:id/units/generate` | admin | Bulk-create units (floors × units per floor, base price, per-floor rise) |
| GET | `/units` | any | List with `project`, `building`, `status`, `type`, `minPrice`, `maxPrice`, `q` |
| POST | `/units` | admin | Create unit |
| GET | `/units/:id` | any | Unit with its confirmed booking (customer hidden from other sales users) |
| PATCH | `/units/:id` | admin | Edit price/type/area, block or unblock (**409** while the unit is booked) |
| GET | `/bookings` | any | List (sales: own bookings only) with `q`, `status`, `project` |
| POST | `/bookings` | any* | Book a unit for an assigned lead → **409** if the unit is no longer available; **400** if the discount or booking amount is over the limit |
| PATCH | `/bookings/:id/cancel` | admin | Cancel with reason → unit available, lead back to Negotiation |
| GET | `/users` | admin | Team list |
| POST | `/users` | admin | Add team member |
| PATCH | `/users/:id` | admin | Edit, change role, deactivate/reactivate (returns how many open leads moved to Unassigned) |

\* Sales employees can only act on leads assigned to them.

---

## Business rules

| Rule | Where it's enforced |
| --- | --- |
| A unit can have only one confirmed booking | Atomic conditional update + partial unique index (`booking.service.js`, `Booking.js`) |
| Only available units can be booked; blocked units can't | Booking service |
| A lead can't hold a stage of Booked without a booking | Lead controller |
| A booked lead's stage is locked until its booking is cancelled | Lead controller |
| Cancelling a booking frees the unit and reopens the lead at Negotiation | Booking service |
| Lost needs a reason and clears the follow-up | Lead validator + controller, UI dialog |
| The first note on a New lead moves it to Contacted; no moving back to New | Lead controller, stage stepper |
| Only an assigned lead can be booked, and the sale is credited to its owner | Booking service (`salesOwner`) |
| Sales employees can discount at most 5% off list; admins can approve more | Booking service + booking form |
| Booking amount ≤ 10% of the agreed price (RERA section 13) | Booking service + booking form |
| Booked units can't be edited or blocked | Property controller (conditional update) |
| Leads can only be assigned to active sales employees | Lead service |
| Follow-ups must be in the future and only on open leads | Lead validator + service |
| One lead per phone number | Normalised phone + unique index, friendly 409 |
| Sales see and change only their own leads and bookings | Controllers scope every query by `req.user` |
| Deactivated users can't sign in or use existing tokens | `authenticate` middleware re-checks `isActive` |
| Deactivating a user, or moving them out of sales, unassigns their open leads | User controller |
| You can't deactivate yourself or change your own role | User controller |

---

## Project structure

```
real-estate-crm/
├── client/                         Next.js (Pages Router)
│   └── src/
│       ├── pages/                  /login, /admin/*, /sales/*
│       ├── components/
│       │   ├── ui/                 shadcn/ui primitives (button, dialog, select, table…)
│       │   ├── common/             PageHeader, Panel, EmptyState, ErrorState, FormField…
│       │   ├── layout/             AppShell (auth + role guard), Sidebar, MobileNav, ThemeToggle
│       │   ├── leads/  bookings/  properties/  dashboard/  team/   feature components
│       ├── context/                AuthContext, ThemeContext
│       ├── hooks/                  useFetch, useUrlFilters, useForm, useDebounce…
│       ├── services/               one file per API resource (async/await + try/catch)
│       ├── lib/                    api client, formatting (₹ L/Cr), constants, navigation
│       └── styles/globals.css      theme tokens (light/dark, admin/sales accents)
└── server/                         Express API
    ├── api/index.js                Vercel serverless entry
    ├── scripts/seed.js             demo data
    └── src/
        ├── config/                 env, cached DB connection
        ├── models/                 Mongoose schemas + indexes
        ├── validators/             Zod schemas per resource
        ├── middleware/             auth, validate, timezone, errorHandler
        ├── services/               business logic (leads, bookings, activity log)
        ├── controllers/            HTTP handlers
        ├── routes/                 route + permission wiring
        └── utils/                  ApiError, dates, phone normalisation, query helpers
```

Theme: the colours live as CSS variables in `globals.css`. `html[data-portal="sales"]` switches the accent from blueprint blue to brass, and `.dark` switches the palette; shadcn components read the same variables, so both portals and both modes come from one set of tokens.

---

## Known limitations

- **No live push.** Inventory refreshes when a screen or dialog opens. If a unit is taken while another user has the booking dialog open, they get a clear 409 and the list refreshes — correct, but not real-time. WebSockets or polling would be the next step.
- **Token in `localStorage`.** Chosen because the client and API live on different domains, where cookie auth needs `SameSite=None` cookies that some browsers block. The trade-off is exposure to XSS; React escapes all rendered text and user content is never inserted as HTML, which reduces that risk. With a shared domain, an httpOnly cookie would be the better choice.
- **Login rate limit is per server instance** (in memory). On serverless it's best-effort; a shared store (e.g. Redis) would make it exact.
- **No password reset or email notifications**, and no file uploads (brochures, KYC documents).
- **Payments are recorded, not processed.** A booking stores the booking amount received; there's no payment schedule or receipt generation.
