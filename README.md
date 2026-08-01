# 🚀 StudyOS AI

> **Your AI-Powered Study Operating System** — AI Tutor · Smart Notes · PDF Intelligence · Quiz Generator · Flashcards · Study Planner · Analytics

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646cff)](https://vitejs.dev)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini-4285F4)](https://ai.google.dev)

---

## 🧠 What is StudyOS AI?

StudyOS AI is a free, open-source AI-powered platform that combines everything a student needs into one beautiful interface:

- 🤖 **AI Tutor** — Gemini-powered chat that explains anything, adapts to your level
- 📝 **Smart Notes** — Create, organize, search, and AI-enhance your notes
- 📄 **PDF Intelligence** — Upload any document, get summaries, notes, and quizzes instantly
- 🧠 **Quiz Generator** — MCQ, short answer, and coding questions with timer and scoring
- 🃏 **Flashcards** — Spaced repetition system for maximum retention
- 📅 **Study Planner** — AI study plans, Pomodoro, calendar, and goal tracking
- 📊 **Analytics** — Beautiful charts showing your study patterns and weak areas

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| UI Components | Custom Design System + Lucide Icons |
| Animations | Framer Motion |
| Routing | React Router v6 |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| Auth + DB | Supabase |
| Storage | Supabase Storage |
| AI | Google Gemini API |
| Backend | FastAPI (Python) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account (free)
- Google AI API key (Gemini)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`

### Backend Setup (Sprint 3)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 📁 Project Structure

```
studyos-ai/
├── frontend/                    # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ui/              # Button, Card, Badge, Input...
│       │   ├── layout/          # Navbar, Footer, Sidebar
│       │   └── sections/        # Landing page sections
│       ├── pages/               # Route pages
│       ├── hooks/               # Custom React hooks
│       ├── contexts/            # React contexts
│       ├── services/            # API service layer
│       ├── api/                 # API client functions
│       ├── utils/               # Utilities (cn, formatters...)
│       ├── constants/           # App-wide constants
│       └── types/               # TypeScript types
├── backend/                     # FastAPI Python backend (Sprint 3)
│   └── app/
│       ├── routers/
│       ├── models/
│       ├── schemas/
│       ├── services/
│       └── utils/
├── database/                    # Supabase schema + migrations
└── docs/                        # Documentation
```

---

## 🗺️ Sprint Roadmap

| Sprint | Focus | Status |
|---|---|---|
| **Sprint 1** | Landing Page + Design System | 🔨 In Progress |
| **Sprint 2** | Auth (Supabase) + Dashboard | 📋 Planned |
| **Sprint 3** | AI Chat (Gemini + FastAPI) | 📋 Planned |
| **Sprint 4** | Notes + PDF Intelligence | 📋 Planned |
| **Sprint 5** | Quiz + Flashcards + Planner | 📋 Planned |
| **Sprint 6** | Analytics + Deploy + Launch | 📋 Planned |

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | `studyos.ai` |
| Backend | Render | `api.studyos.ai` |
| Database | Supabase | `db.studyos.ai` |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with ❤️ for students worldwide.
