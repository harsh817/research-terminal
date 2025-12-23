-- Add caching fields to rss_sources table for conditional GET requests
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS last_fetched timestamptz;
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS last_modified text;
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS etag text;
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS fetch_interval_minutes integer DEFAULT 15;
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE rss_sources ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;