/*
  # Update RLS Policies for Enhanced Security

  1. Changes
    - Restrict authenticated users from modifying news tables (INSERT/UPDATE/DELETE)
    - Block authenticated users from accessing system tables entirely
    - Keep sound_settings restricted to user ownership
    - Keep users table restricted to user ownership

  2. Policy Updates
    - news_items: SELECT only for authenticated users
    - news_archive: SELECT only for authenticated users
    - rss_sources: No policies (effectively service role only)
    - ingestion_logs: No policies (effectively service role only)
    - system_status: No policies (effectively service role only)
    - sound_settings: Already restricted to user ownership
    - users: Already restricted to user ownership

  3. Security Notes
    - All modifications to news tables must go through Edge Functions using service role
    - System tables are completely inaccessible to authenticated users
    - Sound settings and user profiles are strictly user-owned
*/

-- Remove overly permissive policies on news_items
DROP POLICY IF EXISTS "Service role can insert news items" ON news_items;
DROP POLICY IF EXISTS "Service role can update news items" ON news_items;
DROP POLICY IF EXISTS "Service role can delete news items" ON news_items;

-- Create restrictive SELECT-only policy for news_items
DROP POLICY IF EXISTS "Authenticated users can read news items" ON news_items;
CREATE POLICY "Authenticated users can read news items"
  ON news_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Remove overly permissive policies on news_archive
DROP POLICY IF EXISTS "Service role can insert archive" ON news_archive;

-- Create restrictive SELECT-only policy for news_archive
DROP POLICY IF EXISTS "Authenticated users can read archive" ON news_archive;
CREATE POLICY "Authenticated users can read archive"
  ON news_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- Revoke all access to system tables from authenticated users
-- rss_sources
DROP POLICY IF EXISTS "Users can read rss sources" ON rss_sources;
DROP POLICY IF EXISTS "Users can modify rss sources" ON rss_sources;

-- ingestion_logs
DROP POLICY IF EXISTS "Users can read ingestion logs" ON ingestion_logs;
DROP POLICY IF EXISTS "Users can modify ingestion logs" ON ingestion_logs;

-- system_status
DROP POLICY IF EXISTS "Users can read system status" ON system_status;
DROP POLICY IF EXISTS "Users can modify system status" ON system_status;

-- deleted_users
DROP POLICY IF EXISTS "Users can read deleted users" ON deleted_users;
DROP POLICY IF EXISTS "Users can modify deleted users" ON deleted_users;

-- Create allow policy for panes
DROP POLICY IF EXISTS "Public can read panes" ON panes;
CREATE POLICY "Authenticated users can read panes"
  ON panes
  FOR SELECT
  TO authenticated
  USING (true);