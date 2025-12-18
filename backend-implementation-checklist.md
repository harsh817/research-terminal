# Backend Implementation Checklist

## 🔧 Phase 1 – Core Setup & Environment

### Create Supabase Project

- Create a new Supabase project.
- Secure database password and service role key.
- Choose a region close to India (for low latency).

### Add Environment Variables

In Supabase / Edge Functions + frontend:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- APP_BASE_URL (e.g. https://terminal.internal)
- RSS_FEED_URLS (JSON list or comma-separated string)
- (Optional) INTERNAL_CRON_SECRET (to protect scheduled ingest endpoints)

### Initialize Supabase Client

- Set up Supabase SDK in:
  - Frontend (for auth + reads)
  - Edge Functions (for DB writes with service role)
- Ensure auth headers (JWT) are validated on all user-facing API calls.

## 🔐 Phase 2 – Authentication & User Management

### Enable Supabase Auth

Turn on:

- Email + password login.
- Internal-only users (invite only or restricted domains).
- Disable anonymous access.

### Create users Table

Fields:

- id (uuid PK, references auth.users.id)
- email (text)
- name (text, optional)
- created_at, updated_at (timestamps)

### Configure Auth Trigger

Add function + trigger to auto-create users row:

```sql
create function handle_new_user() returns trigger as $$
begin
  insert into public.users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();
```

### Verify JWT Validation

Implement helper in Edge Functions:

- Extract Authorization: Bearer <token>.
- Use Supabase client to verify and get auth.uid().
- Enforce:
  - All user-facing APIs require a valid user.
  - Only service-role calls can bypass user checks (ingestion, archiving).

## 💾 Phase 3 – Database Schema Setup

### Create Core Schema

Create tables:

- users
- news_items
- news_archive
- panes
- sound_settings
- rss_sources
- ingestion_logs
- system_status
- (optional) deleted_users

### Create Enums

- region_t (US, EU, UK, ASIA, CHINA, EM, GLOBAL)
- market_t (EQUITIES, FX, RATES, COMMODITIES, CRYPTO, CREDIT, MACRO)
- theme_t (GEOPOLITICS, MONETARY_POLICY, FISCAL_POLICY, ECONOMIC_DATA, EARNINGS, CORPORATE_NEWS, ENERGY, RISK_EVENT)

### Add Indexes

On news_items:

- published_at
- region
- themes (GIN)

On news_archive:

- published_at

On sound_settings.user_id

On rss_sources.active, rss_sources.region

### Enable Row-Level Security (RLS)

- users, sound_settings:
  - auth.uid() = user_id / id.
- news_items, news_archive, panes:
  - Allow SELECT for any authenticated user.
  - INSERT/UPDATE/DELETE only via service role.
- rss_sources, ingestion_logs, system_status:
  - Service role only (no direct client access).

### Seed panes Table

Insert six pane definitions, e.g.:

- us_markets
- europe_markets
- asia_china
- global_macro
- geopolitics_risk
- commodities_fx

with rules JSON that matches your pane logic (region/market/theme filters).

### Seed rss_sources Table

Seed initial RSS feeds with:

- name
- url
- region
- active = true

## 📰 Phase 4 – RSS Ingestion Pipeline

### Create ingest-rss Edge Function

Only callable by:

- Supabase cron
- Or internal secret header (INTERNAL_CRON_SECRET)

For each active rss_sources row:

- Fetch RSS XML.
- Parse items.
- Normalize:
  - headline
  - url
  - source (from feed)
  - published_at (RSS pubDate → timestamptz)
- Generate hash = sha256(lower(trim(headline)) || source).
- Run rule-based tagging (Phase 5).
- Insert into news_items with:
  - region, markets[], themes[].
- On conflict hash → DO NOTHING.
- Insert ingestion_logs entry:
  - status, items_fetched, error_message.

### Schedule Ingestion (Every Minute)

Configure Supabase Scheduled Functions:

- Call ingest-rss every 60 seconds.

## 🏷️ Phase 5 – Rule-Based Tagging

### Inline Tagging in ingest-rss

For each normalized item:

- Apply string/regex rules across:
  - Headline text
  - Source name
- Decide:
  - Exactly 1 region
  - 1–2 markets
  - 1–2 themes
- Default fallbacks:
  - If no clear region → GLOBAL.
  - If macro-like → MACRO.

### Tag Rule Organization

Keep tag rules as pure functions / config:

- tagRegion(text, source)
- tagMarkets(text, source)
- tagThemes(text, source)

Log "untaggable" items to ingestion_logs for tuning later.

## 📡 Phase 6 – Realtime News Streaming (SSE)

### Create stream-news Edge Function

Implements Server-Sent Events (SSE) endpoint.

Steps:

- Validate JWT → get user_id.
- Open SSE stream.
- On connect:
  - Optionally send recent news snapshot (e.g. last 5 items per pane, or last X minutes).
- Subscribe to DB changes:
  - Use Supabase client or polling-based bridging inside function.
- Push new news_items as event: news with JSON payload.

### Client Responsibilities (UI side)

- Receive SSE events.
- Store in local state.
- Apply pane filters using panes.rules.
- Maintain:
  - Last 3 days of data in UI (scrollable list per pane).
  - Max 10 items for "live view" without scroll, older visible on scroll.

## 🔊 Phase 7 – Sound Settings & Alert Logic

### Create sound-settings Edge Function

**GET /sound-settings**

- Returns current user's sound_settings row.
- If none exists → insert default:
  - enabled = true
  - volume = 1.0
  - sound_tags = {MONETARY_POLICY, GEOPOLITICS, RISK_EVENT}

**POST /sound-settings**

- Input: { enabled, volume, sound_tags }
- Validate:
  - 0 ≤ volume ≤ 1
  - All sound_tags are valid theme_t values.
- Upsert row for user_id.

### Backend Role in Alerts

- No sound playback server-side.
- Only ensure:
  - Every SSE payload includes themes[].
  - No throttling at backend (client manages cooldown).

## 🗂 Phase 8 – Data Retention & Archiving

### Create archive-news Edge Function

Scheduled daily.

Steps:

- Move rows from news_items where published_at < now() - interval '10 days' into news_archive.
- Delete those rows from news_items.

### UI Retention Logic

Frontend queries:

- news_items filtered to published_at >= now() - interval '3 days' for pane screens.
- Archive remains for future search (Phase 2).

## 📊 Phase 9 – System Status & Admin Visibility

### Create system-status Edge Function

**GET /system-status**

Returns:

- status (e.g. "live", "lagging", "error")
- lastIngest
- Optional counts (e.g. items in last hour)

### Update system_status from ingest-rss

After each run:

- Set last_ingest = now().
- status:
  - "live" if success
  - "error" if all feeds failed
  - "partial" if some feeds failed

## 🧱 Phase 10 – Security, RLS & Hardening

### RLS Policies

- users:
  - auth.uid() = id for SELECT/UPDATE.
- sound_settings:
  - auth.uid() = user_id for SELECT/INSERT/UPDATE.
- news_items, news_archive, panes:
  - auth.uid() is not null for SELECT.
  - No INSERT/UPDATE/DELETE without service role.
- rss_sources, ingestion_logs, system_status:
  - Service role only (RLS deny for normal users).

### Edge Function Security

- Validate JWT for all user functions.
- For cron/ingestion:
  - Use INTERNAL_CRON_SECRET header validation or Supabase scheduled function identity.
- Never expose:
  - SUPABASE_SERVICE_ROLE_KEY
  - RSS internal URLs or secrets to client.

## 🧪 Phase 11 – Testing & QA

### Local / Dev Testing

Run Edge Functions locally (supabase functions serve).

Mock RSS feeds with static XML.

Test:

- Parsing and normalization.
- Tagging correctness.
- Dedupe behavior.
- SSE streaming (connect/disconnect/reconnect).

### Integration Scenarios

**Ingestion success:**

- New item appears in DB.
- Appears in SSE stream.
- Visible in correct pane(s).

**Dedupe:**

- Same headline from same source ingested twice → only one row.

**Sound settings:**

- Default created on first login.
- GET/POST work, values persist.

**Archiving:**

- Fake old published_at and run archive job.
- Moves rows to news_archive.

### Error Logging

Add logging for:

- RSS fetch failures.
- Parsing errors.
- Tagging anomalies (no tags matched).
- SSE stream errors.

## 🚀 Phase 12 – Deployment & Production

### Deploy Edge Functions

Deploy:

- ingest-rss
- stream-news
- sound-settings
- archive-news
- system-status

### Configure Supabase Cron

Schedule:

- ingest-rss → every 1 minute.
- archive-news → daily (e.g. 02:00 UTC).

### Configure Auth Redirects

- Add production frontend URL to Supabase Auth.
- Restrict signups to allowed email domains or invite-only.

### Final Go-Live Checklist

- [ ] Auth works (only internal users).
- [ ] RSS ingestion running every minute without errors.
- [ ] Dedupe works (no duplicate headlines).
- [ ] Tagging produces sensible Region/Market/Theme.
- [ ] SSE streaming:
  - [ ] Clients connect and receive new items.
  - [ ] Reconnect logic stable.
- [ ] Sound settings:
  - [ ] Default created.
  - [ ] User changes persist.
- [ ] Archiving:
  - [ ] Old data correctly moved.
- [ ] RLS:
  - [ ] No cross-user access.
  - [ ] No public data exposure.
- [ ] Logs show:
  - [ ] Ingest events.
  - [ ] Errors with enough detail to debug.

## 🧭 Outcome

Once you check off every item in this list:

- Your backend will handle Auth → Ingestion → Tagging → Realtime Stream → Sound Settings → Archiving cleanly.
- The frontend terminal can rely on a simple SSE feed + a few small APIs.
- The system stays fast, cheap, and internal, with room to grow into search, analytics, and historical exploration in later phases.
