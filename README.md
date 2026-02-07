# 🧩 DayFlow

### Your Daily Mosaic of Moments & Money

> An AI diary that pieces together your day from calendar, photos, and conversation — then helps you reflect on spending habits with gentle insights.

**TartanHacks 2026** · Carnegie Mellon University · Theme: **"Mosaic"**

🏆 **Target Prizes:** Best Use of Dedalus API ($500) + Best Use of Tool-Calling ($500)

---

## 🎯 What is DayFlow?

Every day is a mosaic — small tiles of moments, choices, and expenses that form a bigger picture. DayFlow collects these scattered pieces (calendar events, photos, conversations) and assembles them into a meaningful daily portrait.

```
[📅 Calendar] ──┐
[📸 Photos]    ──┼──▶ [⏱️ Timeline] ──▶ [📝 AI Diary] ──▶ [💡 Tomorrow's Tip]
[💬 Chat]      ──┘        │
                      [💰 Spending]
```

### How It Works

1. **Gather** — Import calendar events, upload photos, or chat about your day
2. **Organize** — AI generates a chronological timeline with spending per slot
3. **Reflect** — Get a warm diary entry, spending insight, and a tip for tomorrow
4. **Remember** — Pick your favorite moment of the day

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│              Next.js 14+ (App Router)                    │
│           shadcn/ui + Tailwind CSS                       │
│    [Home/Import] [Timeline] [Spending] [Diary] [Thumb]   │
│                    Deployed on Vercel                     │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────────┐
│                     BACKEND                              │
│              FastAPI (Python 3.10+)                       │
│                                                          │
│   ┌───────────────────────────────────────────────────┐  │
│   │            Dedalus SDK (Python)                    │  │
│   │      AsyncDedalus() → DedalusRunner()             │  │
│   │                                                    │  │
│   │  [MCP Servers]   [Local Tools]   [Structured Out]  │  │
│   │   Calendar      analyze_photo     DiaryOutput      │  │
│   │                 calc_spending     TimelineEvent     │  │
│   └───────────────────────────────────────────────────┘  │
│                                                          │
│              [Supabase DB] ← diaries, spending, users    │
│                    Deployed on Railway                    │
└───────────────────────┬─────────────────────────────────┘
                        │ API calls
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   DEDALUS CLOUD                          │
│   [LLM Routing] → Claude Sonnet 4 / GPT-4o              │
│   [MCP Gateway] → Google Calendar MCP                    │
│   [Tool Exec]   → Local + MCP tool chaining              │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14+ (App Router) | Claude Code generates Next.js best. Vercel one-click deploy. |
| **UI** | shadcn/ui + Tailwind CSS | Copy-paste pro components. |
| **Backend** | FastAPI (Python 3.10+) | Dedalus SDK is Python-native. Async-ready. |
| **Database** | Supabase (PostgreSQL) | Free tier. Built-in auth. |
| **AI/LLM** | Dedalus Labs SDK | MCP + LLM + Tool-Calling in one SDK. |
| **Deploy (Front)** | Vercel | Git push = deployed. |
| **Deploy (Back)** | Railway | Git push = deployed. Python support. |
| **Auth** | Supabase Auth | Google OAuth for Calendar permission reuse. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ & **npm**
- **Python** 3.10+
- **Git**

### 1. Clone the repo

```bash
git clone https://github.com/your-team/dayflow.git
cd dayflow
```

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn main:app --reload
```

### 4. Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Backend** (`.env`):
```bash
DEDALUS_API_KEY=dsk-live-...
DEDALUS_API_URL=https://api.dedaluslabs.ai
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

> ⚠️ **Never commit `.env` files.** All secrets stay local.

---

## 📁 Project Structure

```
dayflow/
├── frontend/                 # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home screen
│   │   │   ├── timeline/page.tsx     # Timeline + Spending
│   │   │   └── diary/page.tsx        # Diary + Suggestion
│   │   ├── components/
│   │   │   ├── HomeImport.tsx        # Calendar/Photo/Chat entry
│   │   │   ├── Timeline.tsx          # Timeline view
│   │   │   ├── SpendingInput.tsx     # Spending per slot
│   │   │   ├── DiaryView.tsx         # Diary display
│   │   │   └── ThumbSelector.tsx     # Favorite moment picker
│   │   └── lib/
│   │       └── supabase.ts           # Supabase client
│   ├── .env.example
│   └── package.json
│
├── backend/                  # FastAPI Server
│   ├── main.py               # App entry point
│   ├── routers/
│   │   ├── calendar.py       # /api/calendar/fetch
│   │   ├── photos.py         # /api/photos/analyze
│   │   ├── chat.py           # /api/chat/talk
│   │   ├── timeline.py       # /api/timeline/generate
│   │   └── diary.py          # /api/diary/generate
│   ├── services/
│   │   └── diary_agent.py    # Dedalus SDK integration
│   ├── models/
│   │   └── schemas.py        # Pydantic models
│   ├── .env.example
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## 📡 API Endpoints

| Method | Path | Description | Dedalus Feature |
|--------|------|-------------|-----------------|
| `POST` | `/api/calendar/fetch` | Fetch today's Google Calendar events | MCP Server |
| `POST` | `/api/photos/analyze` | Upload & analyze photos with Vision | Vision + Local Tools |
| `POST` | `/api/chat/talk` | Conversational day data collection | Chat API (multi-turn) |
| `POST` | `/api/timeline/generate` | Generate structured timeline | Structured Output |
| `PUT` | `/api/timeline/spending` | Add/edit spending per time slot | Direct DB |
| `POST` | `/api/diary/generate` | Generate diary + insight + tip | Full agent pipeline |
| `POST` | `/api/diary/thumb` | Save favorite moment | Direct DB |
| `GET` | `/api/diary/history` | Get past diaries | Direct DB |

---

## 🧠 Dedalus SDK Integration

DayFlow uses three key Dedalus features to target both prizes:

```python
from dedalus_labs import AsyncDedalus, DedalusRunner
from pydantic import BaseModel

client = AsyncDedalus()
runner = DedalusRunner(client)

class DiaryOutput(BaseModel):
    timeline: list[dict]
    diary_text: str
    spending_insight: str
    tomorrow_suggestion: str
    total_spending: int

response = await runner.run(
    input="Analyze user's day and write diary",
    model="anthropic/claude-sonnet-4",
    tools=[analyze_photos, calc_spending],       # 🏆 Tool-Calling Prize
    mcp_servers=["google-calendar-mcp"],          # 🏆 Tool-Calling Prize
    instructions="Warm, non-judgmental diary AI.",
    response_format=DiaryOutput,                  # 🏆 Dedalus API Prize
    stream=True,
    max_steps=10,
)
```

| # | Feature | Dedalus Code | Prize Target |
|---|---------|-------------|--------------|
| 1 | Calendar Read | `mcp_servers=["google-calendar-mcp"]` | Best Tool-Calling |
| 2 | Photo Analysis | `tools=[analyze_photos]` via Vision | Best Dedalus API |
| 3 | Diary Generation | `response_format=DiaryOutput` | Both |

---

## 🗄️ Database Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    diary_text TEXT,
    spending_insight TEXT,
    tomorrow_suggestion TEXT,
    total_spending INTEGER DEFAULT 0,
    thumb_event_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID REFERENCES diaries(id),
    time TEXT NOT NULL,
    emoji TEXT,
    title TEXT NOT NULL,
    description TEXT,
    spending INTEGER DEFAULT 0,
    category TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 📋 MVP Priority

### ✅ MUST HAVE
- Conversational day collection (Dedalus Chat API)
- Timeline generation + spending input UI
- AI diary generation (Dedalus Structured Output)
- Tomorrow's one-line spending suggestion

### 🎯 SHOULD HAVE (increases winning odds)
- Google Calendar MCP integration (Tool-Calling prize)
- Photo analysis via Vision API (Dedalus API prize)
- Thumb / favorite moment selection

### 💫 NICE TO HAVE
- Weekly/monthly spending trend charts
- Daily evening notification reminder

---

## 🗓️ 20-Hour Roadmap

| Hours | A (Frontend) | B (Backend) | C (Backend) | D (UI/Pitch) |
|-------|-------------|-------------|-------------|---------------|
| **0-2h** | Next.js + shadcn setup | FastAPI + Dedalus SDK | Supabase DB + auth | Figma wireframes |
| **2-5h** | Home screen, upload UI | /calendar/fetch MCP | /photos/analyze Vision | UI component designs |
| **5-9h** | Timeline + spending UI | /chat/talk endpoint | /diary/generate logic | Pitch deck narrative |
| **9-13h** | Frontend-backend wiring | API integration test | Thumb + deploy | Demo scenario |
| **13-17h** | Polish + animation | Bug fixes + optimization | Final deploy + CORS | Slides + practice |
| **17-20h** | 🔴 FULL TEAM: Integration test + pitch rehearsal + backup demo |

---

## 🌿 Branch Strategy

```
main        ← Production (auto-deploys)
  └── dev   ← Development integration
       ├── feature/home-screen        (Person A)
       ├── feature/calendar-api       (Person B)
       ├── feature/diary-generation   (Person C)
       └── feature/pitch-deck         (Person D)
```

**Workflow:** `feature/*` → PR to `dev` → Final merge to `main`

---

## 👥 Team Members

| Name | Role | GitHub | LinkedIn |
|------|------|--------|----------|
| **Jong Hyun Son** | TBD | [@jay0930](https://github.com/jay0930) | [LinkedIn](https://www.linkedin.com/in/son0930) |
| **Youngkeun Kim** | TBD | [@yeongkyunkr-dot](https://github.com/yeongkyunkr-dot) | [LinkedIn](https://www.linkedin.com/in/yeongkyun-kim-1aaa22133/) |
| **Seungjae Choi** | TBD | [@boolooppang](https://github.com/boolooppang) | [LinkedIn](https://www.linkedin.com/in/sjchoi96/) |
| **Soomin Seo** | TBD | [@soomin1996](https://github.com/soomin1996) | [LinkedIn](https://www.linkedin.com/in/soominseo96/) |

---

## 📚 Resources

- [Dedalus Labs Docs](https://docs.dedaluslabs.ai/sdk/quickstart)
- [Dedalus Marketplace](https://www.dedaluslabs.ai/marketplace)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Docs](https://supabase.com/docs)

---

## 📄 License

This project was built for TartanHacks 2026 at Carnegie Mellon University.

---

<p align="center">
  <strong>Build the mosaic. Ship the diary. Win the prizes. 🧩</strong>
</p>