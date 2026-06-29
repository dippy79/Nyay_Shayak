# Nyay Shayak — AI Legal Intelligence for India

> An AI-powered legal assistance PWA for Indian citizens — document interpretation, eCourts case tracking, lawyer marketplace, video consultations, and multilingual (EN/HI) support.

---

## Features

- **Document Interpretation** — Upload legal documents for AI analysis powered by Gemini 2.0 Flash
- **eCourts Case Tracking** — Real-time case status via CNR number lookup using Playwright scraping
- **Lawyer Marketplace** — Find verified lawyers by city, specialization, and rating
- **Payments** — Razorpay integration for consultation fee collection
- **Video Consultations** — Daily.co-powered video rooms for remote legal advice
- **Push Notifications** — VAPID-based web push via Supabase subscriptions
- **Multilingual** — Full English and Hindi (i18n) support
- **PWA** — Installable, offline-capable, mobile-first progressive web app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 + Tailwind CSS + PWA (Workbox) |
| Backend | Node.js + Express + TypeScript |
| Scraper | Python 3.10+ + FastAPI + Playwright |
| Database | Supabase (PostgreSQL + Row Level Security) |
| AI | Google Gemini 2.0 Flash |
| Payments | Razorpay |
| Video | Daily.co |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Nyay_Shayak/
├── apps/
│   ├── backend/                  # Express API (TypeScript)
│   │   └── src/
│   │       ├── server.ts         # Main API + all routes
│   │       ├── config/           # Supabase, Gemini configuration
│   │       ├── lib/              # Logger, validation, Gemini client
│   │       └── middleware/       # JWT auth middleware
│   └── frontend/
│       └── vite.config.ts        # Vite + PWA config
├── src/                          # React frontend source
│   ├── pages/
│   │   ├── FindLawyer.tsx        # Lawyer search + listing
│   │   ├── LawyerProfile.tsx     # Individual lawyer profile
│   │   ├── PaymentPage.tsx       # Razorpay payment flow
│   │   └── VideoCall.tsx         # Daily.co video room
│   ├── components/               # AccessibilityBar, BottomNav, ErrorBoundary
│   ├── context/AppContext.tsx    # Global state
│   ├── lib/                      # Supabase client, API client, push
│   └── types/                    # TypeScript type definitions
├── supabase/
│   ├── migrations/               # 11 ordered SQL migrations
│   └── MANUAL_FIX.sql           # RLS grants + lawyers table setup
├── services/
│   ├── court-sync/               # Scheduled eCourts sync job
│   └── gc/                       # Garbage collection service
├── scripts/
│   └── generate-icons.py         # PWA icon generator (Pillow)
├── public/                       # Static assets + PWA icons
├── crawler.py                    # Python FastAPI scraper (port 8000)
├── server.ts                     # Bootstrap entry point (port 3000)
├── package.json                  # Monorepo root (npm workspaces)
└── requirements.txt              # Python dependencies
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase project (free tier works)
- Google AI Studio API key (Gemini)
- Razorpay account
- Daily.co account

---

## Setup

### 1. Install Dependencies

```bash
# JavaScript (installs all workspaces)
npm install

# Python
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Video (Daily.co)
DAILY_API_KEY=your-daily-api-key

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

> Generate VAPID keys: `npx web-push generate-vapid-keys`

### 3. Database Setup

In Supabase SQL Editor, run migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_performance_indexes.sql
supabase/migrations/003_lawyer_platform.sql
supabase/migrations/004_rls_policies.sql
supabase/migrations/005_push_subscriptions.sql
supabase/migrations/006_push_subscriptions_unique.sql
supabase/migrations/007_case_lookups_lockdown.sql
supabase/migrations/008_owner_policies.sql
supabase/migrations/009_payment_atomicity.sql
supabase/migrations/010_courts_city_indexes.sql
```

Then apply RLS grants and lawyers table:

```
supabase/MANUAL_FIX.sql
```

---

## Development

```bash
# Start frontend (port 5173) + backend (port 3000) together
npm run dev

# Start Python scraper in a separate terminal (port 8000)
python crawler.py
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run build` | Production build (Vite) |
| `npm run typecheck` | TypeScript type check — must show 0 errors |
| `npm run test` | Run Jest test suite |
| `npm run test:py` | Run Python crawler tests (pytest) |
| `python crawler.py` | Start FastAPI scraper on port 8000 |
| `python scripts/generate-icons.py` | Regenerate PWA icons |

---

## API Reference

### Backend — port 3000

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lawyers` | List lawyers |
| GET | `/api/lawyers/:id` | Lawyer profile |
| GET | `/api/courts` | Court directory |
| POST | `/api/documents/analyze` | AI document analysis (Gemini) |
| POST | `/api/payments/create` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/video/room` | Create Daily.co room |
| POST | `/api/push/subscribe` | Register push subscription |

### Scraper — port 8000

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Uptime, stats, last scrape time |
| GET | `/scrape?cnr=XXXX` | eCourts CNR case lookup |
| GET/POST | `/update-courts` | Sync courts from eCourts (background) |
| POST | `/crawl` | Court directory search |

---

## Database Tables

All user tables have Row Level Security (RLS) enabled.

| Table | Purpose |
|-------|---------|
| `lawyers` | Lawyer profiles, verification, fees |
| `profiles` | User profiles |
| `cases` | Case tracking records |
| `documents` | Uploaded legal documents |
| `courts` | Court directory |
| `legal_directory` | Extended legal/court directory |
| `estimates` | Fee estimates |
| `user_roles` | Role assignments |
| `case_lookups` | CNR lookup history |

---

## Production Checklist

- [ ] Switch Razorpay from `rzp_test_*` to `rzp_live_*` keys
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (not anon key) in backend env
- [ ] Run all migrations + `MANUAL_FIX.sql` in production Supabase project
- [ ] Verify Gemini API quota for `gemini-2.0-flash`
- [ ] Configure VAPID keys for push notifications
- [ ] Set CORS origins in `apps/backend/src/server.ts` for production domain
- [ ] Run `npm run build` — verify 0 errors
- [ ] Run `npm run typecheck` — verify 0 errors

---

## Deployment

See `DEPLOYMENT.md` for the full production deployment guide.

CI/CD pipeline: `.github/workflows/deploy.yml`

---

## Notes

- **Gemini model:** `gemini-2.0-flash` (do not downgrade to 1.x — quota issues)
- **Supabase key:** Backend must use `service_role` key, frontend uses `anon` key
- **Python on Windows:** Crawler uses `WindowsSelectorEventLoopPolicy` for Playwright compatibility
- **Crawler fallback:** If Playwright/eCourts is unavailable, mock court data is returned automatically

---

## License

Private — All rights reserved.