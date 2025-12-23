-- Add summary field to news_items table
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS summary text;

-- Add summary field to news_archive table for consistency
ALTER TABLE news_archive ADD COLUMN IF NOT EXISTS summary text;