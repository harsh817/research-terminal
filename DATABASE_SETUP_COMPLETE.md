# Database Setup Complete ✓

## Overview

The complete database schema for Research Terminal MVP (Phase 1) has been successfully created in your Supabase project.

## Created Tables (9 total)

### 1. **users** (0 rows)
Stores user profiles linked to Supabase Auth.
- Fields: id, email, name, created_at, updated_at
- RLS: ✓ Enabled (users can only access their own data)

### 2. **news_items** (0 rows)
Active news items (last 10 days).
- Fields: id, headline, source, url, published_at, region, markets[], themes[], hash, created_at
- RLS: ✓ Enabled (authenticated users can read, service role can modify)
- Indexes: published_at, region, created_at

### 3. **news_archive** (0 rows)
Historical news items (older than 10 days).
- Same structure as news_items
- RLS: ✓ Enabled (authenticated users can read, service role can insert)

### 4. **panes** (6 rows)
Fixed UI pane definitions with routing rules.
- Fields: id, title, rules (jsonb), created_at
- RLS: ✓ Enabled (authenticated users can read)
- **Pre-populated with 6 panes:**
  - Americas
  - Europe
  - Asia Pacific
  - Macro & Policy
  - Corporate
  - Risk Events

### 5. **sound_settings** (0 rows)
Per-user sound alert preferences.
- Fields: user_id, enabled, volume, sound_tags[], updated_at
- RLS: ✓ Enabled (users can only access their own settings)
- Default values: enabled=true, volume=0.7, tags=[MONETARY_POLICY, GEOPOLITICS, RISK_EVENT]

### 6. **system_status** (1 row)
Single-row table tracking ingestion health.
- Fields: id, last_ingest, status, updated_at
- RLS: ✓ Enabled (service role only)
- **Pre-populated with initial status: "live"**

### 7. **rss_sources** (0 rows)
RSS feed management.
- Fields: id, name, url, region, active, created_at
- RLS: ✓ Enabled (service role only)

### 8. **ingestion_logs** (0 rows)
Debugging logs for RSS ingestion.
- Fields: id, feed_id, status, items_fetched, error_message, created_at
- RLS: ✓ Enabled (service role only)
- Auto-cleanup: Keeps only last 500 logs

### 9. **deleted_users** (0 rows)
Tracks user deletion events for compliance.
- Fields: id, original_user_id, deleted_at, reason
- RLS: ✓ Enabled (service role only)

## Custom Enum Types

Three custom PostgreSQL enum types have been created:

### **region_t**
- AMERICAS
- EUROPE
- ASIA_PACIFIC
- MIDDLE_EAST
- AFRICA
- GLOBAL

### **market_t**
- EQUITIES
- FIXED_INCOME
- FX
- COMMODITIES
- CRYPTO
- DERIVATIVES
- CREDIT

### **theme_t**
- MONETARY_POLICY
- FISCAL_POLICY
- EARNINGS
- M_AND_A
- GEOPOLITICS
- REGULATION
- RISK_EVENT
- ECONOMIC_DATA
- CORPORATE_ACTION
- MARKET_STRUCTURE

## Security Summary

All tables have Row Level Security (RLS) enabled:

✓ **users** - Users can only read/update their own profile
✓ **sound_settings** - Users can only access their own settings
✓ **news_items** - All authenticated users can read; service role can modify
✓ **news_archive** - All authenticated users can read; service role can insert
✓ **panes** - All authenticated users can read
✓ **system_status** - Service role only
✓ **rss_sources** - Service role only
✓ **ingestion_logs** - Service role only
✓ **deleted_users** - Service role only

## Applied Migrations

1. ✓ `reset_and_create_enums` - Created custom enum types
2. ✓ `create_users_table` - Created users table with RLS
3. ✓ `create_news_tables` - Created news_items and news_archive
4. ✓ `create_panes_table` - Created panes with default data
5. ✓ `create_sound_settings_table` - Created sound_settings with defaults
6. ✓ `create_system_tables` - Created system management tables

## Database Relationships

```
auth.users (Supabase Auth)
    ↓
users (your table)
    ↓
sound_settings

news_items → (no parent, global)
news_archive → (no parent, global)
panes → (no parent, static)

rss_sources
    ↓
ingestion_logs
```

## Next Steps

### 1. Populate RSS Sources (Optional)
Add RSS feeds to start ingesting news:

```sql
INSERT INTO rss_sources (name, url, region, active) VALUES
  ('Reuters Markets', 'https://feeds.reuters.com/reuters/businessNews', 'GLOBAL', true),
  ('Financial Times', 'https://www.ft.com/rss/home', 'EUROPE', true);
```

### 2. Create Ingestion Edge Function
Build an Edge Function to:
- Fetch RSS feeds from `rss_sources`
- Parse and tag news items
- Insert into `news_items`
- Update `system_status`
- Log to `ingestion_logs`

### 3. Test User Flow
1. User signs up → Create row in `users`
2. Auto-create row in `sound_settings` with defaults
3. User can read from `news_items` and `panes`
4. User can update their `sound_settings`

### 4. Archive Old News
Create a scheduled function to move news older than 10 days:

```sql
-- Move old news to archive
INSERT INTO news_archive
SELECT * FROM news_items
WHERE published_at < now() - interval '10 days';

-- Delete from active table
DELETE FROM news_items
WHERE published_at < now() - interval '10 days';
```

## Verification Commands

Check table structure:
```sql
SELECT * FROM panes;
```

Check RLS policies:
```sql
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

Check enum types:
```sql
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('region_t', 'market_t', 'theme_t')
ORDER BY typname, enumlabel;
```

## Reference Documentation

- Full design: `db-design.md`
- Supabase setup: `SUPABASE_SETUP.md`
- Migrations: `supabase/migrations/`

---

**Status**: ✅ Database setup complete and ready for use!
