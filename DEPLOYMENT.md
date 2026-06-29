# Legis Deployment Guide

> Production-ready deployment instructions for Legis v2.0 across all platforms

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Setup](#supabase-setup)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Database Deployment](#database-deployment)
6. [PWA & Mobile](#pwa--mobile)
7. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

Before deploying to production, complete these steps:

### 1. Code Review
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] No console errors or warnings in browser dev tools
- [ ] All API endpoints tested locally
- [ ] Environment variables documented
- [ ] Latest code committed to GitHub

### 2. Security Review
- [ ] No API keys in source code (all in .env)
- [ ] CORS configured for production domain
- [ ] JWT secret updated in Supabase
- [ ] Database RLS policies enabled
- [ ] Rate limiting configured

### 3. Performance Check
- [ ] Build size < 200KB gzipped (`npm run build` → check dist/index.js)
- [ ] Lighthouse score > 85 (run `npm run build && npx http-server dist`)
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 4s

### 4. Testing Complete
- [ ] All unit tests passing (`npm run test` - optional)
- [ ] Manual testing of all features on device
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS 14.4+, Android 7+)
- [ ] Accessibility testing with screen reader

### 5. Documentation
- [ ] README.md updated with production URLs
- [ ] INTEGRATION_CHECKLIST.md all items verified
- [ ] API documentation current
- [ ] Error handling documented

---

## Supabase Setup

### 1. Create Production Project
```bash
# Log in to Supabase
supabase login

# Create new project
supabase projects create --name "legis-prod"

# OR in dashboard: https://app.supabase.com → Create Project
```

### 2. Configure Project
```
Project Name: legis-prod
Database Password: (strong 32+ char password)
Region: Asia-Pacific (Singapore) - closest to India
Pricing: Pro plan ($25/month) for production
```

### 3. Push Migrations
```bash
# Ensure all migrations are created locally first
supabase migration new <migration_name>

# Push to production
supabase db push --linked

# Verify tables created
supabase db tables --linked
```

### 4. Get Connection Details
```bash
# Add to production .env:
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx  # From Settings > API > Service role
```

### 5. Enable Features
```sql
-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage buckets (via dashboard > Storage)
-- Bucket 1: legal-documents (Public read, private write)
-- Bucket 2: videos (Private)

-- Check all extensions
SELECT * FROM pg_extension;
```

### 6. Set Up RLS Policies
```bash
# Verify all RLS policies are enabled in:
# Supabase Dashboard > Authentication > Policies
# OR via CLI:
supabase migration new enable_rls
# Copy RLS policies from 004_rls_policies.sql
```

---

## Frontend Deployment (Vercel)

### 1. Connect GitHub Repository
```bash
# Push code to GitHub (if not already)
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# OR connect via web UI:
# 1. Go to https://vercel.com/new
# 2. Click "Import Git Repository"
# 3. Select "Legis" repository
# 4. Configure build settings
```

### 3. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx
VITE_DAILY_API_KEY=xxxxx
VITE_API_URL=https://api.legis.app  # Your backend URL
VITE_FRONTEND_URL=https://app.legis.app  # Your frontend URL
```

### 4. Build Settings
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

### 5. Verify Deployment
```bash
# Test build locally first
npm run build
npm run preview

# Visit: http://localhost:4173
# Check: Network tab for response times
# Check: Console for errors
```

### 6. Custom Domain
```
1. Buy domain (Namecheap, GoDaddy, Google Domains)
2. Point nameservers to Vercel
3. Add domain in Vercel Dashboard
4. Enable automatic SSL (auto with Vercel)
```

---

## Backend Deployment (Render)

### 1. Create Render Account
- Sign up: https://render.com
- Connect GitHub account
- Create new "Web Service"

### 2. Deploy Backend
```
1. Select GitHub repository
2. Branch: main
3. Runtime: Node
4. Build command: npm install
5. Start command: npm start
6. Plan: Starter ($7/month) or Pro ($12/month)
7. Region: Singapore
```

### 3. Set Environment Variables
In Render Dashboard → Environment:

```
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
SUPABASE_ANON_KEY=eyJxxxxx

# Third-party APIs
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx (SECRET - never in frontend)
DAILY_API_KEY=xxxxx
GEMINI_API_KEY=xxxxx

# Services
SCRAPER_URL=http://scraper.legis.app:8000
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://app.legis.app,https://legis.app

# Frontend
FRONTEND_URL=https://app.legis.app
```

### 4. Deploy
```bash
# Push code to GitHub (backend)
git add .
git commit -m "Production backend"
git push origin main

# Render auto-deploys on push to main
# Monitor: Dashboard → Events
```

### 5. Get Backend URL
- Render provides: `https://legis-backend-xxxxx.onrender.com`
- Update in frontend .env: `VITE_API_URL=https://legis-backend-xxxxx.onrender.com`

### 6. Enable Web Services
```
- Enable HTTPS: ✅ (automatic)
- Enable auto-restart: ✅ (on crash)
- Enable access: ✅ (public)
```

---

## Database Deployment

### 1. Backup Local Data (Optional)
```bash
# Export current data
supabase db dump > backup-$(date +%Y%m%d).sql

# Store safely in version control (if no sensitive data)
git add backup-*.sql
git commit -m "Backup before production push"
```

### 2. Initialize Production Database
```bash
# Push all migrations to production
supabase db push --linked

# Verify tables
supabase db tables --linked
```

Expected output: Should show 6+ tables:
- `lawyers`
- `consultations`
- `reviews`
- `daily_quotes`
- `court_updates`
- `payments`
- `case_lookups`
- `users` (auto-created by Auth)

### 3. Seed Initial Data
```sql
-- In Supabase SQL Editor, add initial lawyers
INSERT INTO lawyers (
  name, 
  specialization, 
  city, 
  rating, 
  rate_per_hour, 
  available,
  created_at
) VALUES 
  ('Raj Kumar Verma', 'Criminal Law', 'New Delhi', 4.8, 500, true, NOW()),
  ('Priya Sharma', 'Civil & Property', 'Mumbai', 4.6, 600, true, NOW()),
  ('Amit Patel', 'Corporate & Tax', 'Bangalore', 4.9, 700, true, NOW()),
  ('Neha Singh', 'Family Law', 'Hyderabad', 4.5, 400, true, NOW()),
  ('Vikram Desai', 'Intellectual Property', 'Delhi', 4.7, 800, true, NOW());

-- Add initial daily quotes
INSERT INTO daily_quotes (quote_en, quote_hi, source, category)
VALUES 
  ('Justice delayed is justice denied', 'न्याय में देरी न्याय से इनकार है', 'Supreme Court', 'Justice'),
  ('The law is the last result of human wisdom', 'कानून मानव ज्ञान का अंतिम परिणाम है', 'Samuel Johnson', 'Law');
```

### 4. Configure Backups
In Supabase Dashboard → Settings → Backups:
- [ ] Enable automatic daily backups
- [ ] Set retention: 7 days (Pro plan)
- [ ] Download backups monthly for safety

### 5. Monitor Database Performance
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check slow queries
SELECT query, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 5;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## PWA & Mobile

### 1. PWA Deployment
```bash
# Build PWA
npm run build

# Verify manifest
cat dist/manifest.json
# Expected: name, short_name, icons, start_url, display: "standalone"

# Verify service worker
ls -la dist/sw.js
```

### 2. Test as PWA
- [ ] Open `https://app.legis.app` in Chrome/Edge
- [ ] Click "Install" button in URL bar
- [ ] App should appear in home screen
- [ ] Works offline (disconnect WiFi/mobile data)
- [ ] Push notifications work

### 3. Android Native App (Optional)
```bash
# Install Bubblewrap
npm i -g @bubblewrap/cli

# Initialize
bubblewrap init --manifest https://app.legis.app/manifest.json

# Build signed APK
bubblewrap build

# Output: app-release-signed.apk
# Upload to Google Play Console
```

### 4. iOS Home Screen
- [ ] Open `https://app.legis.app` in Safari
- [ ] Share → Add to Home Screen
- [ ] iOS 14.4+ supported
- [ ] Native look and feel

---

## Post-Deployment Verification

### Health Check
```bash
# Check backend health
curl https://api.legis.app/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "tables": 6,
  "uptime": "2h 15m"
}
```

### Test API Endpoints
```bash
# Get lawyers
curl https://api.legis.app/api/lawyers

# Get daily quote
curl https://api.legis.app/api/daily-quote

# Test payment (DO NOT process real payments in prod before thoroughly testing)
# Use test cards only (Razorpay provides test credentials)
```

### Test Frontend Routes
- [ ] `/` - Home page loads
- [ ] `/lawyers` - Lawyer list loads with search/filters
- [ ] `/call/:id` - Video call interface loads
- [ ] `/payment/:id` - Payment form loads (test mode)
- [ ] `/auth` - Login/signup works
- [ ] All pages accessible in Hindi/English

### Test Accessibility
- [ ] Font size controls work (normal → 125% → 150%)
- [ ] High contrast mode toggles
- [ ] Screen reader announces content
- [ ] Keyboard navigation works (Tab through elements)
- [ ] Color contrast ratio > 4.5:1

### Monitor Performance
```bash
# Run Lighthouse
npx lighthouse https://app.legis.app --view

# Expected scores:
# - Performance: 85+
# - Accessibility: 90+
# - Best Practices: 90+
# - SEO: 90+
```

### Check Uptime
- [ ] Set up monitoring: https://uptime.com
- [ ] Alert on downtime
- [ ] Check daily for first week
- [ ] Check weekly after stabilization

---

## Troubleshooting

### Common Issues

| Error | Solution |
|-------|----------|
| `API is not responding` | Check Render service status, review logs: `render logs` |
| `Database connection timeout` | Check Supabase status, verify SUPABASE_URL and keys |
| `CORS error on frontend` | Add frontend URL to ALLOWED_ORIGINS in backend .env |
| `Razorpay not working` | Use rzp_live_* keys (not test), verify amount > 100 paise |
| `Service worker not found` | Verify dist/sw.js exists, clear browser cache |
| `HTTPS certificate error` | Wait 48h for DNS propagation or check domain SSL settings |
| `Can't install PWA` | Ensure manifest.json valid, HTTPS enabled |

### View Logs
```bash
# Render logs
render logs --service legis-backend

# Supabase logs
supabase logs --project <project-id> --services api

# Frontend (Vercel)
# Dashboard → Deployments → Select deployment → Logs
```

---

## Monitoring & Maintenance

### Weekly Tasks
- [ ] Check error rates in dashboard
- [ ] Review user feedback
- [ ] Monitor API response times
- [ ] Backup database (automated)

### Monthly Tasks
- [ ] Review performance metrics
- [ ] Update dependencies (`npm update`)
- [ ] Scan for vulnerabilities (`npm audit`)
- [ ] Delete old logs
- [ ] Review costs

### Quarterly Tasks
- [ ] Update Supabase project
- [ ] Audit RLS policies
- [ ] Review and optimize slow queries
- [ ] Plan capacity upgrades

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Razorpay Docs**: https://razorpay.com/docs
- **Daily Docs**: https://docs.daily.co

---

**Last Updated**: 2024  
**Version**: 2.0  
**Maintainer**: Legis Team
