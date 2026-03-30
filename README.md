<div align="center">
<img width="1200" height="475" alt="Legis Banner" src="https://via.placeholder.com/1200x475/005bbf/ffffff?text=Legis+-+Jurisprudence,+Simplified." />
</div>

# Legis: AI-Powered Legal Intelligence for Indian Citizens.

> **Deciphering the Law. Empowering the Citizen.**  
> A high-performance, mobile-first PWA for document interpretation, real-time eCourts tracking, and accessible legal aid. Built with React 19, FastAPI, and Gemini 1.5 Flash.

[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org) [![FastAPI](https://img.shields.io/badge/FastAPI-Python-orange)](https://fastapi.tiangolo.com) [![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-green)](https://ai.google.dev)

## 🚀 Features
- **📱 PWA**: Offline-first, installable, Hindi/voice/sign-language support
- **📸 Document Scanner**: Gemini Vision analyzes challans, summons, notices
- **⚖️ eCourts Tracker**: Real-time CNR case status (captcha-aware scraper)
- **🗺️ Court Directory**: Geospatial PostGIS search (Supreme/High/District)
- **💬 AI Legal Chat**: Context-aware Gemini assistant (English/Hindi)
- **🔒 Supabase Auth**: Phone OTP, RLS, storage for user documents

## 🛠 Quick Start

### Prerequisites
- Node.js 18+ | Python 3.10+ | Supabase project | Gemini API key

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
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SCRAPER_URL=http://localhost:8000
```

### 3. Supabase Setup
```sql
-- Run migrations
supabase db push

-- Create storage bucket: 'legal-documents' (public read)
```

### 4. Run Stack
**Terminal 1 (Frontend/API):**
```bash
npm run dev
```

**Terminal 2 (Scraper):**
```bash
uvicorn crawler:app --reload --port 8000
```

**Live:** http://localhost:5173

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
| Frontend | Backend | Data | AI |
|----------|---------|------|----|
| React 19 | Express/TS | Supabase PG | Gemini 1.5 |
| Vite PWA | FastAPI | PostGIS | Playwright |
| Tailwind 4 | TypeScript | RLS Auth | Vision API |

## 🔮 Roadmap
- [ ] Video sign language (Indian SL)
- [ ] Multi-state eCourts (DL/UP/MH/...)
- [ ] Legal doc templates (bail/summons)
- [ ] Voice-to-text case lookup
- [ ] Lawyer directory + matching

## 📄 License
Apache 2.0 © 2024

**Deciphering the Law. Empowering the Citizen.** 🏛️✨
