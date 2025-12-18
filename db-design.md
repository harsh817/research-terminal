Database Design – Research Terminal MVP (Phase 1)

## Overview

This database is designed for a Supabase/PostgreSQL backend to support:

- Internal authenticated users
- Live RSS-powered news ingestion
- Rule-based tagging (Region, Market, Theme)
- Realtime delivery (SSE subscription)
- Pane definitions
- Sound alert preferences
- News archiving

All tables use uuid primary keys, RLS, and Supabase Auth integration.

The design prioritizes:

- Clean structure
- Fast filtering
- Lightweight tagging
- Reliable ingestion
- Multi-pane mapping per item
- Expandability for Phase 2

## 1. users

### Purpose
Stores basic user profiles and per-user sound preferences.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK, references auth.users.id) | Internal user ID |
| email | text | Email copied from Auth |
| name | text | Optional display name |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Updated on profile change |

### Relationships
- users.id → referenced by sound_settings.

### Notes
- No credit or plan tracking (internal-only MVP).
- Every user gets default sound settings on first login.

## 2. news_items (Active)

### Purpose
Stores live news items ingested from RSS feeds and classified via rule-based tagging.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Unique news item ID |
| headline | text | Cleaned headline |
| source | text | Name of the publisher |
| url | text | Original article URL |
| published_at | timestamptz | Original publish time |
| region | region_t | One region tag |
| markets | market_t[] | One or more market tags |
| themes | theme_t[] | One or two theme tags |
| hash | text unique | Content hash to enforce dedupe |
| created_at | timestamp | Insert timestamp |

### Relationships
- None — news is global.

### Notes
- Hash ensures duplicates aren't ingested twice.
- Only stores last 10 days (older moved to archive).

## 3. news_archive (Phase-2 Usage)

### Purpose
Stores older news items beyond the 10-day active window.

### Fields
- Same structure as news_items.

### Notes
- Archive is write-only for now.
- Phase 2 will unlock deeper search and analytics.

## 4. panes

### Purpose
Defines the six fixed panes in the UI and their rule sets.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | text (PK) | Pane identifier ("us_markets", "europe", etc.) |
| title | text | User-visible pane name |
| rules | jsonb | Rule set defining which tags route news into this pane |

### Relationships
- None.

### Notes
- Panes never change in MVP.
- Rules include:
  - region filters
  - market filters
  - theme filters

## 5. sound_settings

### Purpose
Stores per-user alert configuration.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| user_id | uuid (PK → users.id) | Owner of the sound settings |
| enabled | boolean | Global ON/OFF toggle |
| volume | numeric | Volume level (0–1) |
| sound_tags | theme_t[] | Themes that trigger sound |
| updated_at | timestamp | Last updated time |

### Relationships
- user_id → users.id

### Notes
- Only theme-based sounds allowed in MVP.
- Default enabled tags:
  - MONETARY_POLICY
  - GEOPOLITICS
  - RISK_EVENT

## 6. system_status

### Purpose
Tracks ingestion health and last-run state.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | boolean (PK, default true) | Single-row table |
| last_ingest | timestamp | Last RSS ingestion time |
| status | text | "live", "lagging", or "error" |

### Notes
- Useful for header connection/ingest indicator.
- Only updated by service role Edge Functions.

## 7. rss_sources (Optional but Useful)

### Purpose
Store and manage RSS feed URLs.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Feed ID |
| name | text | Feed name (Reuters Markets, FT Europe) |
| url | text | RSS URL |
| region | region_t | Region classification |
| active | boolean | Enable/disable feed |
| created_at | timestamp | Added at |

### Notes
- Makes ingestion dynamic (no hardcoded feeds).
- Nice for internal debugging.

## 8. ingestion_logs

### Purpose
Keep thin logs for debugging ingestion issues.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Log ID |
| feed_id | uuid (FK → rss_sources.id, nullable) | Which feed |
| status | text | "success", "failed" |
| items_fetched | integer | Count ingested |
| error_message | text | Error details |
| created_at | timestamp | Log time |

### Notes
- Only last ~500 logs retained.
- Not user-facing.

## 9. deleted_users (Optional)

### Purpose
Track user deletion events.

### Fields
| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | Record ID |
| original_user_id | uuid | User removed |
| deleted_at | timestamp | Removal time |
| reason | text | Optional |

### Notes
- Since internal-only MVP, likely minimal use.

## RLS Summary

### users
- Read only by owner.

### sound_settings
- Read/update only by owner.

### news_items
- Readable by any authenticated internal user.

### news_archive
- Same as news_items.

### panes
- Readable by all authenticated users.

### rss_sources, ingestion_logs, system_status
- Readable only by service role
- Not exposed to clients

## Relationship Diagram (Simple)

```
users
 └── sound_settings

news_items → no parent
news_archive → no parent

panes → no parent

rss_sources
 └── ingestion_logs
```

News is intentionally global, not user-scoped.

## Relationship Logic Summary

### User Login
- User signs in → create default sound_settings.

### RSS Ingestion
- Pull RSS → normalize → tag → dedupe → store in news_items.
- Update system_status.
- Log into ingestion_logs.

### Realtime Delivery
- SSE stream pushes new news_items rows.

### Pane Mapping
- Each item is evaluated client-side against panes.rules.

### Sound Alerts
- Client checks:
  - If item.theme ∈ sound_tags
  - If enabled = true
  - If cooldown is satisfied

### Archiving (Daily)
- Move items older than 10 days → news_archive.

## Data Retention Policy

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Active news | 10 days | Visible in UI |
| Archive | Long-term | Phase 2 search |
| Sound settings | Permanent | User preference |
| System logs | Rolling 500 entries | Debug only |
| Deleted users | 1 year | Compliance |
