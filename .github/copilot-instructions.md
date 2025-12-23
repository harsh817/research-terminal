# Research Terminal - AI Agent Instructions

## Project Overview

**Research Terminal** is a real-time financial news terminal built with Next.js 13+ (App Router) and Supabase. It displays live news in a 6-pane layout with rule-based tag filtering, sound alerts, and Server-Sent Events (SSE) streaming.

**Tech Stack**: Next.js, TypeScript, Supabase (PostgreSQL + Edge Functions), Tailwind CSS, Radix UI, shadcn/ui

## Architecture

### Frontend (Next.js App Router)
- **Main Terminal**: `app/terminal/page.tsx` - Six fixed panes displaying filtered news
- **Pane Component**: `components/pane.tsx` - Individual news pane with max 10 items
- **News Hook**: `hooks/use-news-feed.ts` - Manages real-time subscriptions per pane
- **Auth**: `lib/auth-context.tsx` - Supabase Auth integration with provider pattern
- **Config Validation**: `lib/config.ts` - Validates Supabase credentials before client creation

### Backend (Supabase Edge Functions)
Located in `supabase/functions/`:
- **ingest-rss**: Fetches RSS/Atom feeds, applies rule-based tagging, deduplicates via content hash
- **stream-news**: SSE endpoint for real-time news delivery with pane-specific filtering
- **sound-settings**: Manages per-user sound alert preferences
- **archive-news**: Moves news items older than 10 days to `news_archive` table
- **system-status**: Health checks for ingestion and database

All Edge Functions use Deno runtime with JSR/NPM imports.

### Database Schema (PostgreSQL)
Key tables:
- `news_items`: Active news with `region` (text), `markets[]`, `themes[]`, `hash` (deduplication)
- `panes`: Six fixed panes with `rules` (JSONB) defining tag filters
- `rss_sources`: Feed URLs with `etag`, `last_modified` for conditional GET requests
- `sound_settings`: Per-user alert preferences linked to `auth.users`
- `news_archive`: Historical data (10+ days old)

**Critical Pattern**: Tag-based filtering uses arrays (`markets[]`, `themes[]`) with ANY/OR logic across rule groups.

## Tag System

Tags are **rule-based**, not AI-generated. They're applied during RSS ingestion via regex patterns in `lib/tag-rules.ts`:

- **Region**: Single value (AMERICAS, EUROPE, ASIA_PACIFIC, MIDDLE_EAST, AFRICA, GLOBAL)
- **Markets**: Array (EQUITIES, FIXED_INCOME, FX, COMMODITIES, CRYPTO, DERIVATIVES, CREDIT)
- **Themes**: Array (MONETARY_POLICY, FISCAL_POLICY, EARNINGS, M_AND_A, GEOPOLITICS, REGULATION, RISK_EVENT, ECONOMIC_DATA, CORPORATE_ACTION, MARKET_STRUCTURE)

**Pattern**: Each tag type has `{ pattern: RegExp, region/market/theme: EnumValue }[]` rules. Headlines are matched against these patterns during ingestion.

## Real-Time Updates

News flows from RSS → Edge Function → Database → Frontend via two mechanisms:

1. **Initial Load**: `use-news-feed.ts` queries `news_items` table directly with pane rule filtering
2. **Live Updates**: Supabase Realtime subscriptions listen to `news_items` inserts, filter client-side

**Critical**: `use-news-feed.ts` tracks `loadedItemIds` to avoid duplicate sound alerts on initial load vs. live inserts.

## Development Workflow

### Setup
```powershell
# Install dependencies
npm install

# Configure environment (see SUPABASE_SETUP.md)
# Edit .env with your Supabase project URL/keys

# Run dev server
npm run dev

# Deploy Edge Functions
supabase functions deploy ingest-rss
supabase functions deploy stream-news
```

### Database Migrations
Apply migrations in order from `supabase/migrations/`:
1. Run via Supabase Dashboard SQL Editor, OR
2. Use Supabase CLI: `supabase db push`

**Note**: Migrations are idempotent with `IF NOT EXISTS` checks.

### Testing RSS Ingestion
```powershell
# Manual trigger (requires SUPABASE_ANON_KEY from .env)
Invoke-WebRequest -Uri "https://YOUR_PROJECT.supabase.co/functions/v1/ingest-rss" `
  -Method POST `
  -Headers @{"Authorization"="Bearer YOUR_ANON_KEY"; "Content-Type"="application/json"}
```

## Project-Specific Conventions

### Client-Side Supabase Usage
Always use `lib/supabase-client.ts` wrapper, never direct `@supabase/supabase-js` imports:
```typescript
import { createClient } from '@/lib/supabase-client' // ✅ Correct
import { createClient } from '@supabase/supabase-js' // ❌ Wrong
```
This ensures config validation and singleton pattern.

### Error Handling Pattern
All components check for config errors first:
```typescript
if (error?.includes('not configured')) {
  // Show ConfigError component with SUPABASE_SETUP.md reference
}
```

### Sound Alerts
- Managed by `lib/sound-settings-context.tsx` provider
- Cooldown logic (5s default) prevents alert fatigue
- `isNew` flag in `NewsItemData` triggers sound on first appearance

### Component Structure
- **UI Components**: `components/ui/` (shadcn/ui primitives)
- **Feature Components**: `components/` (news-item, pane, header-bar, etc.)
- **Hooks**: `hooks/` (use-news-feed, use-toast)
- **Contexts**: `lib/` (auth-context, connection-context, sound-settings-context)

## Common Tasks

### Adding a New Pane
1. Add row to `panes` table with `id`, `title`, and `rules` JSONB
2. Update `PANE_CONFIGS` in `app/terminal/page.tsx`

### Adding a New Tag Rule
1. Edit `lib/tag-rules.ts` to add regex pattern
2. Redeploy `ingest-rss` Edge Function (it imports this logic)

### Debugging Real-Time Issues
- Check browser console for Supabase Realtime connection status
- Verify pane rules in `panes` table match expected filter logic
- Inspect `news_items` table to confirm tags are being applied

## Key Files Reference

- **Docs**: `mvp-plan.md`, `db-design.md`, `backend-implementation-checklist.md`, `RSS_SETUP_GUIDE.md`
- **Entry Point**: `app/terminal/page.tsx`
- **Real-Time Logic**: `hooks/use-news-feed.ts`
- **Tagging Engine**: `lib/tag-rules.ts`, `supabase/functions/ingest-rss/index.ts`
- **Database Schema**: `supabase/migrations/20251217144333_create_news_system.sql`

## Environment Variables

Required in `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
INTERNAL_CRON_SECRET=secure-cron-secret-2025-research-terminal
```

**Critical**: Never commit `.env` to git. Use placeholder values in templates.

## Testing Checklist

- [ ] Verify Supabase connection via config validation
- [ ] Check real-time updates by inserting into `news_items` table
- [ ] Test sound alerts with high-priority tags
- [ ] Confirm pane filtering matches rule logic
- [ ] Validate RSS ingestion with `ingest-rss` Edge Function
