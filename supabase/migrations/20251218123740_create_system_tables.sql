/*
  # Create System Tables

  1. New Tables
    - `system_status` (single-row table for ingestion health)
      - `id` (boolean, primary key, always true)
      - `last_ingest` (timestamptz, last RSS ingestion time)
      - `status` (text, "live", "lagging", or "error")
      - `updated_at` (timestamptz, last update timestamp)
    
    - `rss_sources` (RSS feed management)
      - `id` (uuid, primary key)
      - `name` (text, feed name)
      - `url` (text, RSS URL)
      - `region` (region_t, region classification)
      - `active` (boolean, enable/disable feed)
      - `created_at` (timestamptz, creation timestamp)
    
    - `ingestion_logs` (debugging ingestion issues)
      - `id` (uuid, primary key)
      - `feed_id` (uuid, nullable, references rss_sources.id)
      - `status` (text, "success" or "failed")
      - `items_fetched` (integer, count ingested)
      - `error_message` (text, error details)
      - `created_at` (timestamptz, log time)
    
    - `deleted_users` (track user deletion events)
      - `id` (uuid, primary key)
      - `original_user_id` (uuid, user removed)
      - `deleted_at` (timestamptz, removal time)
      - `reason` (text, optional reason)
  
  2. Security
    - Enable RLS on all tables
    - System tables are service-role only
    - Not exposed to client applications
  
  3. Notes
    - system_status is a single-row table
    - ingestion_logs retains only last 500 entries
    - deleted_users for compliance tracking
*/

-- Create system_status table (single-row)
CREATE TABLE IF NOT EXISTS system_status (
  id boolean PRIMARY KEY DEFAULT true,
  last_ingest timestamptz,
  status text DEFAULT 'live' NOT NULL CHECK (status IN ('live', 'lagging', 'error')),
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT single_row CHECK (id = true)
);

-- Create rss_sources table
CREATE TABLE IF NOT EXISTS rss_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text UNIQUE NOT NULL,
  region region_t NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create ingestion_logs table
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES rss_sources(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed')),
  items_fetched integer DEFAULT 0 NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create deleted_users table
CREATE TABLE IF NOT EXISTS deleted_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id uuid NOT NULL,
  deleted_at timestamptz DEFAULT now() NOT NULL,
  reason text
);

-- Enable RLS on all system tables
ALTER TABLE system_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- Policies: Only service role can access system tables
-- No SELECT policies for regular authenticated users

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS ingestion_logs_created_at_idx ON ingestion_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ingestion_logs_feed_id_idx ON ingestion_logs(feed_id);
CREATE INDEX IF NOT EXISTS deleted_users_deleted_at_idx ON deleted_users(deleted_at DESC);

-- Insert initial system_status row
INSERT INTO system_status (id, last_ingest, status)
VALUES (true, now(), 'live')
ON CONFLICT (id) DO NOTHING;

-- Function to clean old ingestion logs (keep only last 500)
CREATE OR REPLACE FUNCTION cleanup_old_ingestion_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ingestion_logs
  WHERE id NOT IN (
    SELECT id FROM ingestion_logs
    ORDER BY created_at DESC
    LIMIT 500
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;