# Legis Documentation Map

> Find exactly what you need in 30 seconds

---

## 🚀 Start Here

**New to the project?**
→ Start with [README.md](./README.md)

**Want to start developing right now?**
→ Go to [QUICK_START.md](./QUICK_START.md)

**Just completed development, ready to test?**
→ Follow [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)

**Ready to deploy to production?**
→ Read [DEPLOYMENT.md](./DEPLOYMENT.md)

**Want to understand what was built in this session?**
→ See [SESSION_SUMMARY.md](./SESSION_SUMMARY.md)

---

## 📚 Documentation by Topic

### Getting Started
- [README.md](./README.md) - Project overview, features, quick start
- [QUICK_START.md](./QUICK_START.md) - 5-minute setup guide
- [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) - What was implemented (Phase 1-8)

### Development
- [README.md - API Endpoints](./README.md#%EF%B8%8F-api-endpoints) - All backend routes
- [README.md - Testing](./README.md#-testing) - Test procedures for all features
- [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Complete health check (100+ items)

### Deployment & DevOps
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Step-by-step production guide
- [README.md - Troubleshooting](./README.md#-troubleshooting) - Common errors & fixes
- [DEPLOYMENT.md - Monitoring](./DEPLOYMENT.md#monitoring--maintenance) - Maintain production

### Architecture & Design
- [SESSION_SUMMARY.md - Tech Stack](./SESSION_SUMMARY.md#-tech-stack-integrated) - Technologies used
- [SESSION_SUMMARY.md - Patterns](./SESSION_SUMMARY.md#-key-learning-implementation-patterns) - Design patterns
- [README.md - Structure](./README.md#-structure) - Project folder layout

### Features
- [README.md - Features](./README.md#-features) - All 13 features listed
- [SESSION_SUMMARY.md - Complete Features](./SESSION_SUMMARY.md#-what-works-now) - What works, what's partial
- [README.md - API Endpoints](./README.md#%EF%B8%8F-api-endpoints) - How to use each feature

### Security & Accessibility
- [README.md - Security](./README.md#-security) - Security practices
- [README.md - Testing](./README.md#-testing) - Accessibility testing
- [SESSION_SUMMARY.md - Quality Metrics](./SESSION_SUMMARY.md#-quality-metrics) - WCAG compliance

### Mobile & PWA
- [README.md - PWA Enhancements](./README.md#pwa-enhancements) - Offline support, installation
- [DEPLOYMENT.md - PWA & Mobile](./DEPLOYMENT.md#pwa--mobile) - Deploy as app
- [SESSION_SUMMARY.md - Phase 7](./SESSION_SUMMARY.md#phase-7-pwa-configuration--95) - PWA details

---

## 🔍 Find Answers By Question

### "How do I...?"

#### ...start coding?
→ [QUICK_START.md](./QUICK_START.md#%EF%B8%8F-5-minute-setup)

#### ...run the app locally?
→ [README.md - Quick Start](./README.md#-quick-start) → section "4. Run Stack"

#### ...test a feature?
→ [README.md - Testing](./README.md#-testing) → Pick the feature → Follow test steps

#### ...deploy to production?
→ [DEPLOYMENT.md](./DEPLOYMENT.md) → Choose platform (Vercel/Render)

#### ...add a new API endpoint?
→ [SESSION_SUMMARY.md - API Endpoints](./SESSION_SUMMARY.md#deliverables-10-endpoints-added-to-serverts)

#### ...make something accessible?
→ [SESSION_SUMMARY.md - Phase 4](./SESSION_SUMMARY.md#phase-4-accessibility-features--100)

#### ...fix an error?
→ [README.md - Troubleshooting](./README.md#-troubleshooting)

#### ...understand the database?
→ [SESSION_SUMMARY.md - Phase 1](./SESSION_SUMMARY.md#phase-1-database-schema--100)

#### ...monitor production?
→ [DEPLOYMENT.md - Post-Deployment Verification](./DEPLOYMENT.md#post-deployment-verification)

#### ...enable push notifications?
→ [QUICK_START.md - Generate VAPID Keys](./QUICK_START.md#generate-vapid-keys-for-push-notifications)

---

## 📊 Feature Documentation

### Lawyer Marketplace
- Where to read: [README.md](./README.md#lawyer-marketplace)
- Code file: [src/pages/FindLawyer.tsx](./src/pages/FindLawyer.tsx)
- API endpoint: `GET /api/lawyers`
- Test procedure: [README.md - Testing](./README.md#1-database-health)

### Video Consultations
- Where to read: [README.md](./README.md#video-consultations)
- Code file: [src/pages/VideoCall.tsx](./src/pages/VideoCall.tsx)
- API endpoint: `POST /api/video/create-room`
- Third-party: Daily.co

### Payments
- Where to read: [README.md](./README.md#payment-integration)
- Code file: [src/pages/PaymentPage.tsx](./src/pages/PaymentPage.tsx)
- API endpoints: `POST /api/payments/create-order`, `POST /api/payments/verify`
- Third-party: Razorpay

### Accessibility
- Where to read: [README.md](./README.md#accessibility-suite) & [SESSION_SUMMARY.md - Phase 4](./SESSION_SUMMARY.md#phase-4-accessibility-features--100)
- Code files: [src/components/AccessibilityBar.tsx](./src/components/AccessibilityBar.tsx)
- Test procedure: [README.md - Testing](./README.md#6-push-notifications)

### Court Auto-Sync
- Where to read: [README.md](./README.md#court-update-auto-sync)
- Code file: [services/court-sync/index.ts](./services/court-sync/index.ts)
- Scheduler: Runs every 6 hours (0, 6am, 12pm, 6pm)
- API endpoint: `POST /api/court-updates/sync`

### PWA & Offline
- Where to read: [README.md](./README.md#pwa-enhancements)
- Config file: [apps/frontend/vite.config.ts](./apps/frontend/vite.config.ts)
- Test procedure: [INTEGRATION_CHECKLIST.md - Section 5](./INTEGRATION_CHECKLIST.md)

---

## 👥 Role-Based Guides

### Developer
1. [README.md](./README.md) - Understand the project
2. [QUICK_START.md](./QUICK_START.md) - Set up environment
3. [README.md - API Endpoints](./README.md#%EF%B8%8F-api-endpoints) - Know what to build
4. [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Test your code
5. [README.md - Troubleshooting](./README.md#-troubleshooting) - Fix errors

### QA/Tester
1. [README.md - Features](./README.md#-features) - Understand what to test
2. [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - 100+ test cases (follow all)
3. [README.md - Testing](./README.md#-testing) - Detailed test procedures
4. [README.md - Troubleshooting](./README.md#-troubleshooting) - How to resolve failures

### DevOps/Deployment
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup
2. [DEPLOYMENT.md - Pre-Deployment Checklist](./DEPLOYMENT.md#pre-deployment-checklist) - Ensure readiness
3. [DEPLOYMENT.md - Post-Deployment Verification](./DEPLOYMENT.md#post-deployment-verification) - Verify success
4. [DEPLOYMENT.md - Monitoring & Maintenance](./DEPLOYMENT.md#monitoring--maintenance) - Keep it running

### Project Manager
1. [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) - What was built
2. [README.md - Features](./README.md#-features) - Feature list for stakeholders
3. [INTEGRATION_CHECKLIST.md - Health Check](./INTEGRATION_CHECKLIST.md) - Know when ready to launch
4. [DEPLOYMENT.md - Before Going Live](./DEPLOYMENT.md#complete-these-tasks) - Pre-launch tasks

### Architect/Lead
1. [SESSION_SUMMARY.md - Tech Stack](./SESSION_SUMMARY.md#-tech-stack-integrated) - Technologies used
2. [SESSION_SUMMARY.md - Phase Completion](./SESSION_SUMMARY.md#-phase-completion-report) - What was delivered
3. [SESSION_SUMMARY.md - Implementation Patterns](./SESSION_SUMMARY.md#-key-learning-implementation-patterns) - Design decisions
4. [DEPLOYMENT.md - Architecture](./DEPLOYMENT.md) - Deployment architecture

---

## 🚨 Emergency Troubleshooting

**Something's broken! What do I do?**

1. **Check the error message**
   - Is it a frontend error? Check browser console (F12)
   - Is it a backend error? Check terminal logs
   - Is it a database error? Check Supabase dashboard

2. **Search the troubleshooting guide**
   - [README.md - Troubleshooting](./README.md#-troubleshooting) - Common issues table

3. **Follow the health check**
   - [INTEGRATION_CHECKLIST.md - Section 2](./INTEGRATION_CHECKLIST.md) - API health verification

4. **Still stuck?**
   - Check [DEPLOYMENT.md - Troubleshooting](./DEPLOYMENT.md#troubleshooting)
   - Review [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) for context
   - Check if it's a known limitation: [SESSION_SUMMARY.md - Known Limitations](./SESSION_SUMMARY.md#-known-limitations--future-work)

---

## 📈 Documentation Statistics

| Document | Purpose | Length |
|----------|---------|--------|
| [README.md](./README.md) | User guide | ~450 lines |
| [QUICK_START.md](./QUICK_START.md) | Setup guide | ~200 lines |
| [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) | Testing guide | 280+ lines |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment | 400+ lines |
| [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) | Implementation record | 600+ lines |
| [GETTING_HELP.md](./GETTING_HELP.md) | Documentation map | This file! |
| **TOTAL** | **Complete documentation** | **~2,000 lines** |

---

## 💡 Pro Tips

### Keyboard Shortcuts
- **Browser DevTools**: `F12` (Windows) or `Cmd+Option+I` (Mac)
- **Search documentation**: `Ctrl+F` in any Markdown file
- **Jump to section**: Click heading in table of contents

### Reading Order
1. First-time? Start with [README.md](./README.md)
2. Starting development? Go to [QUICK_START.md](./QUICK_START.md)
3. Deploying? Jump to [DEPLOYMENT.md](./DEPLOYMENT.md)
4. Need details? See [SESSION_SUMMARY.md](./SESSION_SUMMARY.md)

### Versioning
- Current: **v2.0**
- Previous: v1.0 (legal document scanner)
- Next: v3.0 (AI legal drafting - planned)

---

## 📞 Support Resources

### Built-in Resources
- [README.md - Support](./README.md#-support) - Community links
- [README.md - Contributing](./README.md#-contributing) - How to contribute

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Razorpay Docs**: https://razorpay.com/docs
- **Daily.co Docs**: https://docs.daily.co

---

## ✨ What Are You Looking For?

**Pick one:**

| Need | Go to |
|------|-------|
| Get started NOW | [QUICK_START.md](./QUICK_START.md) |
| Learn about features | [README.md](./README.md#-features) |
| Run tests | [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) |
| Deploy to production | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Understand the code | [SESSION_SUMMARY.md](./SESSION_SUMMARY.md) |
| Fix an error | [README.md#-troubleshooting](./README.md#-troubleshooting) |
| Find API endpoints | [README.md#%EF%B8%8F-api-endpoints](./README.md#%EF%B8%8F-api-endpoints) |
| Manage accessibility | [README.md#-testing](./README.md#-testing) |
| View project status | [SESSION_SUMMARY.md#-work-summary](./SESSION_SUMMARY.md#-work-summary) |
| Get unstuck | [README.md#-troubleshooting](./README.md#-troubleshooting) |

---

**Last Updated**: 2024  
**Current Version**: v2.0  
**Status**: Documentation Complete ✅
