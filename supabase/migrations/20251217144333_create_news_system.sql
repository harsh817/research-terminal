/*
  # News Terminal Database Schema

  ## Overview
  Creates the database structure for the real-time news terminal system with support for
  news items, tags, and pane-based organization.

  ## New Tables

  ### `news_items`
  - `id` (uuid, primary key) - Unique identifier for each news item
  - `headline` (text, not null) - News headline
  - `source` (text, not null) - News source name
  - `url` (text, not null) - Link to original article
  - `published_at` (timestamptz, not null) - Original publication timestamp
  - `created_at` (timestamptz, default now()) - When record was created in our system
  - `is_active` (boolean, default true) - Soft delete flag

  ### `tags`
  - `id` (uuid, primary key) - Unique identifier for each tag
  - `type` (text, not null) - Tag type: 'region', 'market', or 'theme'
  - `value` (text, not null) - Tag display value (e.g., 'Americas', 'Equity', 'Monetary Policy')
  - `sound_enabled` (boolean, default false) - Whether this tag triggers sound alerts
  - `pane_assignment` (text, not null) - Which pane this tag belongs to
  - `created_at` (timestamptz, default now())
  - Unique constraint on (type, value)

  ### `news_item_tags`
  - `news_item_id` (uuid, foreign key) - References news_items.id
  - `tag_id` (uuid, foreign key) - References tags.id
  - `created_at` (timestamptz, default now())
  - Primary key on (news_item_id, tag_id)

  ## Security
  - Enable RLS on all tables
  - Allow public read access (this is a read-only news terminal)
  - Restrict write access to authenticated service users only

  ## Indexes
  - Index on news_items.published_at for sorting
  - Index on news_items.created_at for real-time queries
  - Index on tags.type and tags.pane_assignment for filtering
  - Index on news_item_tags junction table foreign keys
*/

-- Create news_items table
CREATE TABLE IF NOT EXISTS news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('region', 'market', 'theme')),
  value text NOT NULL,
  sound_enabled boolean NOT NULL DEFAULT false,
  pane_assignment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_tag UNIQUE (type, value)
);

-- Create junction table for news items and tags
CREATE TABLE IF NOT EXISTS news_item_tags (
  news_item_id uuid NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (news_item_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_is_active ON news_items(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(type);
CREATE INDEX IF NOT EXISTS idx_tags_pane ON tags(pane_assignment);
CREATE INDEX IF NOT EXISTS idx_news_item_tags_news_item ON news_item_tags(news_item_id);
CREATE INDEX IF NOT EXISTS idx_news_item_tags_tag ON news_item_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_item_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for news_items
CREATE POLICY "Anyone can view active news items"
  ON news_items
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only authenticated users can insert news items"
  ON news_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update news items"
  ON news_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for tags
CREATE POLICY "Anyone can view tags"
  ON tags
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert tags"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update tags"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for news_item_tags
CREATE POLICY "Anyone can view news item tags"
  ON news_item_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can insert news item tags"
  ON news_item_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete news item tags"
  ON news_item_tags
  FOR DELETE
  TO authenticated
  USING (true);
