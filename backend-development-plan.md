# BACKEND DEVELOPMENT PLAN — RESEARCH TERMINAL (PHASE 1)

## 0) Assumptions (Confirmed)

### Runtime
- Supabase (Postgres + Auth + Storage + Edge Functions)

### Server-side
- Supabase Edge Functions (Deno only)
- No Node microservices in Phase 1

### News ingestion
- RSS feeds only (primary)
- Optional free APIs where RSS is unavailable

### Ingestion frequency
- Every 1 minute (cron-triggered)

### Users
- Truly internal only
- Auth required for all access

### Realtime delivery
- Server-Sent Events (SSE)
- Chosen because:
  - Simpler than WebSockets
  - Works very well with Supabase Edge Functions
  - One-way push fits news streaming perfectly
  - Lower operational risk

### Data retention
- Active news: last 10 days
- UI panes show last 3 days, scrollable
- Older than 10 days → archived (Phase 2)

### Tagging
- Fully rule-based
- No ML in Phase 1

## 1) News Sources (RSS + Free APIs)

### Primary (RSS – recommended)
Use these first. They are reliable and free.

- Reuters RSS
- Bloomberg RSS (limited but usable)
- CNBC RSS
- Financial Times RSS
- Wall Street Journal RSS (headlines only)
- Central bank RSS (Fed, ECB, BOE, BOJ)
- Government / regulator RSS

### Optional Free APIs (if needed)
- GDELT (global events, geopolitics)
- NewsAPI (free tier, limited)
- Alpha Vantage News (very limited, but free)

### Rule
RSS first. APIs only when RSS is unavailable.

## 2) Supabase Project Setup

### Create Supabase project
- Enable Auth:
  - Email/password
  - Google OAuth
  - Disable public signups (internal access only)

### Edge Functions to Create
- `ingest-rss`
- `tag-news`
- `dedupe-news`
- `stream-news`
- `system-status`
- `archive-news` (scheduled)
- `sound-settings`

### Secrets
```
RSS_FEED_URLS          (JSON array)
APP_BASE_URL
INTERNAL_CRON_SECRET
```

## 3) Database Schema (SQL)

### Enums
```sql
create type region_t as enum (
  'US','EU','UK','ASIA','CHINA','EM','GLOBAL'
);

create type market_t as enum (
  'EQUITIES','FX','RATES','COMMODITIES','CRYPTO','CREDIT','MACRO'
);

create type theme_t as enum (
  'GEOPOLITICS','MONETARY_POLICY','FISCAL_POLICY',
  'ECONOMIC_DATA','EARNINGS','CORPORATE_NEWS',
  'ENERGY','RISK_EVENT'
);
```

### News Items (Active)
```sql
create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  source text not null,
  url text not null,
  published_at timestamptz not null,
  region region_t not null,
  markets market_t[] not null,
  themes theme_t[] not null,
  hash text unique not null,
  created_at timestamptz default now()
);
```

### Archived News (Phase-1 storage, Phase-2 usage)
```sql
create table public.news_archive (
  like public.news_items including all
);
```

### Panes (Static Config)
```sql
create table public.panes (
  id text primary key,
  title text not null,
  rules jsonb not null
);
```

### Sound Settings
```sql
create table public.sound_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean default true,
  volume numeric default 1.0,
  sound_tags theme_t[] not null,
  updated_at timestamptz default now()
);
```

## 4) Row Level Security (RLS)

### News Items (Read-only)
```sql
alter table public.news_items enable row level security;

create policy "read news items"
on public.news_items
for select
using (auth.uid() is not null);
```

### Sound Settings (User-owned)
```sql
alter table public.sound_settings enable row level security;

create policy "own sound settings"
on public.sound_settings
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

## 5) RSS Ingestion — Edge Function

### Function: `ingest-rss`

### Trigger
- Supabase scheduled job
- Every 1 minute

### Flow
1. Fetch all RSS feeds
2. Normalize:
   - Headline
   - URL
   - Source
   - Published time
3. Generate hash:
   - `sha256(normalized_headline + source)`
4. Insert into `news_items`
5. Ignore duplicates via hash constraint

## 6) Rule-Based Tagging

### Function: `tag-news`

### When
- Inline during ingestion

### Rules
- Exactly 1 region
- 1–2 markets
- 1–2 themes

### Examples
- Mentions "Fed", "FOMC" → US, RATES, MONETARY_POLICY
- Mentions "oil", "OPEC" → GLOBAL, COMMODITIES, ENERGY

Rules are stored as code (not DB) in Phase 1.

## 7) De-duplication Strategy

### Handled by:
- Deterministic hash
- Time window tolerance

### Updates
- Treated as new items
- Old items naturally fall off panes

## 8) Realtime Streaming (SSE)

### Function: `stream-news`

### Why SSE
- Simpler than WebSockets
- One-way push fits use case
- Stable with Edge Functions

### Behavior
- Authenticated connection
- Subscribes to inserts on `news_items`
- Pushes JSON payload immediately

### Payload includes:
- News item
- Tags
- Published time

## 9) Pane Filtering

### Where
- Client-side (preferred)

### Why
- One stream
- No duplication
- Easier to evolve pane logic

### Each client:
- Applies pane rules locally
- Shows max 10 items per pane
- Allows scroll for last 3 days

## 10) Sound Alert Logic

### Runs
- Client-side only

### Server provides
- Tags
- Timestamps

### Conditions
- New item
- Tag ∈ sound_tags
- Sound enabled
- Cooldown satisfied

Server never blocks delivery.

## 11) Data Retention & Archiving

### Function: `archive-news`

### Trigger
- Daily scheduled job

### Logic
- Move items older than 10 days:
  - `news_items` → `news_archive`
- Delete from active table

### UI only queries:
- Last 3 days by default
- Scroll allowed

## 12) System Status

### Function: `system-status`

### Returns:
```json
{
  "status": "live",
  "lastIngest": "2025-01-01T12:34:00Z"
}
```

Used by header indicator.

## 13) Rate Limits & Protection

- Limit ingestion runs
- Cap SSE connections per user
- CDN-level protection
- No per-user quotas in Phase 1.

## 14) Observability

### Structured logs in all functions

### Log:
- `function_name`
- `feed`
- `item_id`
- `error`

Basic alerts on ingestion failure

## 15) Security

- Auth required everywhere
- No public tables
- No public storage
- All ingestion via service role
- No secrets exposed to client

## 16) Tests (Pragmatic)

### Unit
- Hash generation
- Tag rules

### Integration
- RSS → DB
- DB → SSE

### Manual
- Burst test
- Duplicate test
- Sound-trigger verification

## 17) Deployment Steps

1. Create Supabase project
2. Apply schema + RLS
3. Deploy Edge Functions
4. Configure RSS feeds
5. Schedule ingestion
6. Test streaming
7. Test archive job

## 18) Launch Checklist

- [ ] RSS ingestion every minute
- [ ] No duplicates
- [ ] Tags consistent
- [ ] SSE stable
- [ ] UI scrolls last 3 days
- [ ] Archive after 10 days
- [ ] Sound metadata correct

## 19) API Surface (Edge Functions)

```
POST /ingest-rss        (cron / internal)
GET  /stream-news      (SSE)
GET  /system-status
GET  /sound-settings
POST /sound-settings
POST /archive-news     (scheduled)
```