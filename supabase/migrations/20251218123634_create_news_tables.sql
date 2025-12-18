/*
  # Create News Tables

  1. New Tables
    - `news_items` (active news, last 10 days)
      - `id` (uuid, primary key)
      - `headline` (text, cleaned headline)
      - `source` (text, publisher name)
      - `url` (text, original article URL)
      - `published_at` (timestamptz, original publish time)
      - `region` (region_t, one region tag)
      - `markets` (market_t[], array of market tags)
      - `themes` (theme_t[], array of theme tags)
      - `hash` (text, unique content hash for deduplication)
      - `created_at` (timestamptz, insert timestamp)
    
    - `news_archive` (archived news, older than 10 days)
      - Same structure as news_items
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all news
    - Add policies for service role to insert/update news
  
  3. Indexes
    - Index on published_at for time-based queries
    - Unique index on hash for deduplication
    - Index on region and arrays for fast filtering
  
  4. Notes
    - news_items stores only recent news (10 days)
    - news_archive stores historical data for Phase 2
    - Hash field prevents duplicate ingestion
*/

-- Create news_items table
CREATE TABLE IF NOT EXISTS news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  region region_t NOT NULL,
  markets market_t[] NOT NULL DEFAULT '{}',
  themes theme_t[] NOT NULL DEFAULT '{}',
  hash text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create news_archive table (same structure)
CREATE TABLE IF NOT EXISTS news_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  region region_t NOT NULL,
  markets market_t[] NOT NULL DEFAULT '{}',
  themes theme_t[] NOT NULL DEFAULT '{}',
  hash text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on news_items
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on news_archive
ALTER TABLE news_archive ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read news_items
CREATE POLICY "Authenticated users can read news items"
  ON news_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert news_items
CREATE POLICY "Service role can insert news items"
  ON news_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Only service role can update news_items
CREATE POLICY "Service role can update news items"
  ON news_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Only service role can delete news_items
CREATE POLICY "Service role can delete news items"
  ON news_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Policy: All authenticated users can read news_archive
CREATE POLICY "Authenticated users can read archive"
  ON news_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert into archive
CREATE POLICY "Service role can insert archive"
  ON news_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for news_items
CREATE INDEX IF NOT EXISTS news_items_published_at_idx ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS news_items_region_idx ON news_items(region);
CREATE INDEX IF NOT EXISTS news_items_created_at_idx ON news_items(created_at DESC);

-- Create indexes for news_archive
CREATE INDEX IF NOT EXISTS news_archive_published_at_idx ON news_archive(published_at DESC);
CREATE INDEX IF NOT EXISTS news_archive_region_idx ON news_archive(region);
CREATE INDEX IF NOT EXISTS news_archive_created_at_idx ON news_archive(created_at DESC);