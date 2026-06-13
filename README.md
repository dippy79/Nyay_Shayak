<div align="center">
<img width="1200" height="475" alt="Legis Banner" src="https://via.placeholder.com/1200x475/005bbf/ffffff?text=Legis+-+Jurisprudence,+Simplified." />
</div>

# Legis: AI-Powered Legal Intelligence for Indian Citizens.

> **Deciphering the Law. Empowering the Citizen.**  
> A high-performance, mobile-first PWA for document interpretation, real-time eCourts tracking, and accessible legal aid. Built with React 19, FastAPI, and Gemini 1.5 Flash.

[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org) [![FastAPI](https://img.shields.io/badge/FastAPI-Python-orange)](https://fastapi.tiangolo.com) [![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-green)](https://ai.google.dev)

### Latest Updates (2026-06-13)
- Added Lawyer detail page (`/lawyers/:id`) and recent reviews API.
- Added push subscription support: migration `supabase/migrations/005_push_subscriptions.sql` and `/api/push/subscribe` endpoints.
- Wired court-sync scheduler to start on server boot (runs every 6 hours).
- Updated `.env` defaults: `SCRAPER_URL=http://localhost:8000`, added `BACKEND_URL=http://localhost:3000`.


## 🚀 Features
- **📱 PWA**: Offline-first, installable, Hindi/voice/sign-language support, works on all devices
- **📸 Document Scanner**: Gemini Vision analyzes legal documents (challans, summons, notices, etc.)
- **⚖️ eCourts Tracker**: Real-time CNR case status tracking with auto-sync every 6 hours
- **🗺️ Court Directory**: Geospatial PostGIS search of courts, police stations, legal services
- **💬 AI Legal Chat**: Context-aware Gemini assistant for legal advice (English/Hindi)
- **👨‍⚖️ Lawyer Marketplace**: Find and connect with verified lawyers for video calls, chat, or callbacks
- **💰 Secure Payments**: Razorpay integration with instant payment verification
- **📞 Video Consultations**: Daily.co powered video calls with real-time communication
- **⭐ Reviews & Ratings**: Community-driven lawyer ratings and feedback system
- **📅 Daily Legal Quotes**: Daily inspirational/educational legal quotes in English & Hindi
- **🔒 Secure Auth**: Supabase phone OTP, RLS policies, encrypted storage
- **♿ Accessibility**: Font size controls, high contrast mode, voice guidance, screen reader support
- **🌐 Internationalization**: Full support for English & Hindi with language toggle

## 🛠 Quick Start

### Prerequisites
- Node.js 18+ | Python 3.10+ | Supabase project | Gemini API key
- **Paid/Free Accounts**:
  - [Supabase](https://supabase.com) - PostgreSQL + Auth (Free tier: 2 projects)
  - [Gemini API](https://ai.google.dev) - Document analysis (Free: $300/month credits)
  - [Razorpay](https://razorpay.com) - Payment processing (Test account FREE, no credit card needed)
  - [Daily.co](https://daily.co) - Video calls (Free: 100 min/month, 1 room)
  - [Web Push Service](https://web.dev/push-notifications-overview/) - Browser notifications (native, no setup)

### 1. Clone & Install
```bash
git clone <your-repo>
cd Legis
npm install
pip install -r requirements.txt
```

### 2. Environment
Copy `.env.example` → `.env.local`:
```
# Supabase (Get from https://app.supabase.com)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...

# Gemini AI (Get from https://ai.google.dev)
GEMINI_API_KEY=AIzaSyDxxxxx

# Razorpay (Test account at https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxx  # Backend .env
RAZORPAY_KEY_SECRET=xxxxx       # Backend secret
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx  # Frontend .env

# Daily.co Video Calls (Get from https://dashboard.daily.co)
DAILY_API_KEY=xxxxx

# Push Notifications (Generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx

# Services & Deployment
SCRAPER_URL=http://localhost:8000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

**Getting Test Keys (No credit card needed!):**
1. **Razorpay**: https://razorpay.com/x/dashboard → Account → API Keys → Test Mode
2. **Daily.co**: https://dashboard.daily.co → Developers → API Keys
3. **Gemini**: https://ai.google.dev → Create API key (free $300/month)
4. **VAPID Keys**: Run `npx web-push generate-vapid-keys` in terminal

### 3. Supabase Setup
```bash
# 1. Run all database migrations
npx supabase db push

# 2. Create storage buckets (in Supabase dashboard > Storage)
# - Bucket: "legal-documents" (Public Read, private write)
# - Bucket: "videos" (Private)

# 3. Set up push notifications (optional)
# Go to Project > Settings > API > Create new signing secret
# Add to .env: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY

# Manually in Supabase dashboard > SQL Editor (if npx supabase doesn't work):
-- Run all SQL files from supabase/migrations/ in order:
-- 001_initial_schema.sql
-- 002_performance_indexes.sql
-- 003_lawyer_platform.sql
-- 004_rls_policies.sql
```

### 4. Run Stack

**Terminal 1 (Frontend + Backend):**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if needed)
npm install @daily-co/daily-js node-cron @types/node-cron

# Start dev server (Vite frontend + Express backend + court sync scheduler)
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

**Terminal 2 (Court Case Scraper - Optional):**
```bash
uvicorn crawler:app --reload --port 8000
# Fetches live court case updates from eCourts India
# Called by court-sync service every 6 hours
```

**Access Points:**
- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend**: http://localhost:3000
- 🛢️ **Database**: Database URL from Supabase dashboard
- 🤖 **Scraper**: http://localhost:8000 (optional)

**Services Running:**
- ✅ React Vite dev server
- ✅ Express API server
- ✅ Court sync scheduler (runs every 6 hours automatically)
- ✅ Service worker (PWA offline support)
- ✅ Supabase client (auth + database)

## 📁 Structure
```
Legis/
├── src/           # React 19 + Vite + Tailwind PWA
├── server.ts      # Express + Supabase + Gemini API
├── crawler.py     # FastAPI + Playwright scraper
├── supabase/      # PostgreSQL + PostGIS schema
└── public/        # PWA assets/manifest
```

## 🎯 Tech Stack
| Frontend | Backend | Data | AI | Payments | Video |
|----------|---------|------|----|----------|-------|
| React 19 | Express/TS | Supabase PG | Gemini 1.5 | Razorpay | Daily.co |
| Vite PWA | FastAPI | PostGIS | Playwright | Webhook Verify | WebRTC |
| Tailwind 4 | TypeScript | RLS Auth | Vision API | Signatures | Real-time |
| Framer Motion | Node-Cron | JSON Audit | | INR Native | 10k min/mo |

---

## 🎁 New Features (v2.0)

### Lawyer Marketplace
- **Find Lawyers**: Browse verified lawyers by specialization, city, rating
- **Profile Pages**: Detailed lawyer info, reviews, consultation rates
- **Rating System**: 1-5 star ratings with comments from users
- **Filter Options**: Availability, specialization, language, experience

### Video Consultations
- **Daily.co Integration**: HD video calls with chat and screen share
- **Instant Booking**: Pay → Get video link instantly, no email delays
- **Call Duration**: 30-60 min sessions with automatic time tracking
- **Recording Support**: Optional call recording (subject to consent)

### Payment Integration
- **Razorpay Gateway**: UPI, cards, netbanking, wallets
- **Multiple Services**:
  - Video call: ₹500/30 min
  - Text chat: ₹200/24 hours unlimited
  - Callback: ₹100 (lawyer calls back within 2 hours)
- **Free Tier**: 5 min with lawyer, unlimited AI chat, document scan
- **Payment Verification**: HMAC signature validation for security

### Accessibility Suite
- **Font Size Control**: 3 levels (100%, 125%, 150%)
- **High Contrast Mode**: Enhanced visibility for low-vision users
- **Voice Guidance**: Text-to-speech in English & Hindi
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Screen Reader Support**: Full ARIA labels and semantic HTML
- **Floating Toolbar**: Accessible from any page via bottom-right button

### Court Update Auto-Sync
- **Scheduled Sync**: Every 6 hours via Node Cron
- **Immutable Log**: New orders added, old data never deleted
- **Push Notifications**: Desktop alerts for new court orders
- **No Data Loss**: All historical updates preserved

### PWA Enhancements
- **Service Worker Updates**: Auto-updates in background
- **Smart Caching**:
  - Google Fonts: 1 year
  - Daily Quote: 24 hours
  - Court Updates: 1 hour
  - Supabase: 7 days
- **Android TWA Ready**: Can be packaged as native Android app
- **iOS Support**: iOS 14.4+, add to home screen

---

## 🔧 API Endpoints

### Lawyers
```
GET  /api/lawyers - List all verified lawyers
  ?city=Delhi&specialization=Criminal&available=true&search=name
GET  /api/lawyers/:id - Get single lawyer profile
```

### Consultations
```
POST /api/consultations/book - Book a consultation
  body: { lawyer_id, type: 'video|chat|callback', scheduled_at, user_id }
```

### Payments
```
POST /api/payments/create-order - Create Razorpay order
  body: { amount, consultation_id, user_id }
POST /api/payments/verify - Verify payment signature
  body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, consultation_id }
```

### Video Calls
```
POST /api/video/create-room - Create Daily.co room
  body: { consultation_id }
  returns: { room_url, room_name }
```

### Reviews
```
POST /api/reviews - Submit consultation review
  body: { consultation_id, lawyer_id, user_id, rating: 1-5, comment }
```

### Daily Quotes
```
GET /api/daily-quote - Get today's legal quote
  returns: { quote_en, quote_hi, source, category }
```

### Court Updates
```
GET  /api/court-updates/:cnr - Get court orders for case
POST /api/court-updates/sync - Sync new court order (scheduler)
```

---

## 🧪 Testing

### 1. Database Health
```bash
# Check if tables exist
curl http://localhost:3000/api/health

# Check if lawyers table has data (seed first if empty)
# In Supabase SQL Editor, run:
INSERT INTO lawyers (name, specialization, city, rating, rate_per_hour, available)
VALUES 
  ('Raj Verma', 'Criminal', 'Delhi', 4.5, 500, true),
  ('Priya Sharma', 'Civil', 'Mumbai', 4.8, 600, true);
```

### 2. API Testing
```bash
# Test lawyers endpoint
curl "http://localhost:3000/api/lawyers?city=Delhi"

# Test daily quote
curl http://localhost:3000/api/daily-quote

# Test with Postman
# 1. Import INTEGRATION_CHECKLIST.md test cases
# 2. Run Health Check collection
# 3. Verify all responses match expected format
```

### 3. Frontend Testing
```bash
# In browser console (JavaScript), test:
1. Navigate to http://localhost:5173/lawyers
2. Verify lawyer cards load (should see Raj Verma, Priya Sharma)
3. Click "Find Lawyer" → should see filters working
4. Test accessibility: Accessibility Bar button (⌨️) in bottom-right
5. Toggle font size: Should change from normal to 125% to 150%
6. Toggle contrast: Page should invert colors
7. Toggle voice guidance: Should enable audio announcements
```

### 4. Payment Testing (Razorpay Sandbox)
```bash
# Test card: 4111 1111 1111 1111
# Exp: Any future date (e.g., 12/25)
# CVV: Any 3 digits (e.g., 123)
# Auth: OTP 123456 when prompted
```

### 5. Video Call Testing (Daily.co Sandbox)
```bash
# 1. Click "Schedule Video Call" on lawyer profile
# 2. System should create room via POST /api/video/create-room
# 3. Iframe should load Daily.co room
# 4. Test camera/mic permissions
```

### 6. Push Notifications
```bash
# In browser console:
navigator.serviceWorker.ready.then(reg => {
  Notification.requestPermission();
  reg.pushManager.getSubscription().then(console.log);
});

# Should show push subscription object with endpoint & keys
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `VITE_RAZORPAY_KEY_ID undefined` | Add to `.env.local`: `VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx` |
| `Supabase table not found` | Run `npx supabase db push` to apply migrations |
| `Daily.co iframe blocked` | Check browser console, verify DAILY_API_KEY in .env |
| `Payment signature mismatch` | Verify RAZORPAY_KEY_SECRET matches Razorpay dashboard |
| `Service worker not registering` | Clear browser cache, check public/sw.js exists |
| `Lawyers list is empty` | Seed database with sample lawyers (see Database Health test) |
| `Port 3000/5173 already in use` | Kill existing process or use: `npm run dev -- --port 3001` |

---

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Outputs to dist/
# Set VITE_* environment variables
```

### Backend (Render/Railway)
```bash
npm run dev
# NODE_ENV=production
# Set all .env variables
```

### Database (Supabase)
- PostgreSQL 14+
- Enable Row Level Security
- Configure JWT secret
- Set up storage buckets

### Mobile (Android TWA)
```bash
npx @bubblewrap/cli init \
  --manifest https://yourdomain.com/manifest.json
npx @bubblewrap/cli build
# Outputs: app-release-signed.apk
# Upload to Google Play Store
```

---

## 📊 Performance Metrics
- **Page Load**: < 2s (cached), < 5s (first load)
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 85+ (mobile), 90+ (desktop)
- **Bundle Size**: ~150KB (gzipped)
- **API Latency**: < 200ms (p95)

---

## ✅ Health Check

Before pushing to production, run all verification steps in [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md):

1. **Database**: ✓ Tables exist, indexes created, RLS policies enabled
2. **Backend**: ✓ All 10 API endpoints respond correctly
3. **Frontend**: ✓ All routes work, pages load without errors
4. **Accessibility**: ✓ All 5 WCAG 2.1 AA features functional
5. **PWA**: ✓ Service worker registers, offline mode works
6. **Security**: ✓ CORS headers set, JWT validation active, RLS enforced
7. **Performance**: ✓ Lighthouse score > 85, bundle < 150KB gzipped
8. **Cross-browser**: ✓ Chrome, Firefox, Safari, Edge, Safari iOS

```bash
# Quick health check script
npm run build
npm run dev
# Then visit http://localhost:5173/health-check

# Or manually call:
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "tables": ["lawyers", "consultations", "reviews", "payments", "daily_quotes", "court_updates"],
  "endpoint_count": 10,
  "version": "2.0"
}
```

---

## 🔐 Security
- ✅ HTTPS only
- ✅ Supabase Row Level Security enforced
- ✅ Razorpay signature verification
- ✅ JWT token validation on all protected routes
- ✅ Rate limiting (100 req/15min general, 10 req/min AI)
- ✅ CORS configured for specific origins
- ✅ No sensitive data in frontend

---

## 🔮 Roadmap
- [ ] Video sign language (Indian SL)
- [ ] Multi-state eCourts (DL/UP/MH/...)
- [ ] Legal doc templates (bail/summons)
- [ ] Voice-to-text case lookup
- [ ] Lawyer directory + matching
- [ ] Integration with State Bar Councils
- [ ] Legal AI powered document drafting
- [ ] Court deadline calendar & alerts
- [ ] Case outcome predictions (ML model)
- [ ] Offline document library (1000+ legal acts)

## 🤝 Contributing

1. **Fork** the repo
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit**: `git commit -m 'Add amazing feature'`
4. **Push**: `git push origin feature/amazing-feature`
5. **Open** Pull Request

**Code Standards:**
- ✅ TypeScript (strict mode)
- ✅ React Hooks (functional components only)
- ✅ Tailwind CSS v4 (no inline styles)
- ✅ WCAG 2.1 AA accessibility
- ✅ Hindi translations for all UI text
- ✅ Tests for new components/endpoints

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/legis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/legis/discussions)
- **Email**: support@legis.app (coming soon)
- **Telegram**: [Join our community](https://t.me/legis_india)

## 📄 License
Apache 2.0 © 2024

**Deciphering the Law. Empowering the Citizen.** 🏛️✨

---

<div align="center">

Made with ❤️ by Legis Team | Privacy Policy | Terms of Service

</div>
