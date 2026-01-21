# MVP PLAN — PHASE 1

Internal Research Terminal for Finance

## ✅ Implementation Status (Updated: January 2026)

### Core MVP Features - COMPLETED
- [x] News Ingestion (30 RSS sources)
- [x] Real-Time Updates (Supabase Realtime with unique channels)
- [x] Six-Pane Layout (Americas, Europe, Asia Pacific, Macro & Policy, Corporate, Risk Events)
- [x] Tagging System (Region, Markets, Themes)
- [x] Pane Logic (Priority-based exclusive routing)
- [x] News Interaction (Click to open in new tab)
- [x] Sound Alerts (Tag-based with cooldown)
- [x] Reliability (Graceful error handling, logging)

### Additional Features - COMPLETED
- [x] **User Authentication** - Supabase Auth with login/signup
- [x] **Saved Items/Bookmarks** - Star/unsave with real-time sync
- [x] **Read/Unread Tracking** - Visual indicators with per-user state
- [x] **Date Filtering** - Shows today's news only (6-hour buffer)
- [x] **Source Monitor Dashboard** - RSS feed health & statistics
- [x] **Settings Page** - Sound controls + Source monitoring tabs
- [x] **Row-Level Security** - User data isolation

### Tech Stack - IMPLEMENTED
- **Frontend**: Next.js 13.5 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Edge Functions)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Ingestion**: External cron triggers Edge Function every 5 minutes

---

## 1. Product Overview — 1-Liner Vision

A real-time financial research terminal that surfaces critical global news through tagged, live-updating panes so users never miss market-moving events.

## 2. Finalized MVP Features — Phase 1 Must-Haves

These features define the full scope of Phase 1.
Nothing outside this list is included.

### News Ingestion

- Ingest news from a limited set of trusted sources.
- Normalize headlines, timestamps, sources, and URLs.
- De-duplicate identical or near-identical stories.

### Real-Time Updates

- Push-based live updates (no manual refresh).
- New items appear as they happen.
- System remains stable during bursts of news.

### Six-Pane Layout

- Fixed six-pane layout.
- Each pane is driven by tag-based rules.
- Panes update independently.
- No scrolling inside panes.
- Max 10 items per pane.

### Tagging System

- Strict, predefined tag taxonomy.
- Three tag dimensions:
  - Region
  - Market / Asset Class
  - Theme
- Every news item must have:
  - 1 region tag
  - 1–2 market tags
  - 1–2 theme tags
- Tags are visible on every headline.

### Pane Logic

- Each pane is powered by tag rules.
- A single news item can appear in multiple panes.
- No duplication within the same pane.

### News Interaction

- Click headline → opens original source in new tab.
- Terminal state remains unchanged.

### Sound Alerts

- Sound alerts tied to specific high-priority tags.
- Short, neutral sound.
- Burst protection and cooldown logic.
- Visual highlight always accompanies sound.

### Reliability

- Graceful handling of feed failures.
- Logging of ingestion and delivery errors.
- No UI crashes due to backend issues.

## 3. Detailed User Journey — Phase 1

### Step 1: User Opens the Terminal

- The user opens the web app.
- They land directly on the terminal interface.
- Six panes fill the screen.
- Each pane already shows live news.

### Step 2: User Scans the Panes

- The user scans top headlines across all panes.
- They read:
  - Tags first
  - Headlines second
- They understand what matters within seconds.

### Step 3: Live News Arrives

- A new story breaks.
- It appears at the top of one or more panes.
- The headline highlights briefly.
- If it carries a sound-enabled tag:
  - A short sound plays once.
  - The user looks at the screen immediately.

### Step 4: User Clicks a Headline

- The user clicks a relevant headline.
- The original article opens in a new tab.
- The terminal stays open and live.

### Step 5: Continuous Monitoring

- The terminal stays open throughout the day.
- News updates silently.
- Critical news interrupts only when needed.
- The terminal becomes a constant awareness layer.

## 4. Edge Case Notes

These are known cases to handle explicitly.

### News Bursts

- Multiple headlines arrive at once.
- Items insert in correct time order.
- Only one sound plays per burst window.

### Duplicate Stories

- Same story from multiple sources.
- Only one headline shown per pane.
- De-duplication happens before rendering.

### Updated Headlines

- Materially changed headline → treated as new item.
- Old headline naturally drops down or off.

### Quiet Panes

- Some panes may show fewer than 10 items.
- This is acceptable and expected.

### Connection Drop

- Live updates pause.
- UI remains stable.
- Resume without full refresh.

### Browser Audio Restrictions

- If sound is blocked:
  - Visual alerts still fire.
  - No error shown to user.

## 5. Tech Stack + Monetization Plan

### Suggested Tech Stack (Phase-1 Ready)

**Frontend**
- React or Next.js
- WebSockets or Server-Sent Events for live updates
- Lightweight animation for highlights
- Dark-mode-friendly UI

**Backend**
- Node.js or Python (FastAPI)
- News ingestion workers
- Tagging and de-duplication service
- Real-time event stream

**Data**
- PostgreSQL for structured data
- Redis for real-time queues and caching

**Infrastructure**
- Cloud-hosted (AWS / GCP / Azure)
- Containerized services
- Basic monitoring and logging

### Monetization Plan (Not Active in Phase 1)

Phase 1 is internal only.

Future monetization paths:
- Per-seat SaaS pricing
- Premium alert tiers
- Advanced tagging and analytics
- Enterprise feeds and integrations

None of this is built in Phase 1.

## Phase-1 MVP Success Definition

The MVP is successful if:
- Users keep the terminal open all day.
- Sound alerts are trusted and not muted.
- Users say they "caught news early."
- The system feels calm, fast, and reliable.
