-- Add Reliable RSS Sources and Update Broken Ones
-- Dec 27, 2025

-- Disable sources with persistent DNS/network issues
UPDATE rss_sources 
SET active = false, 
    last_error = 'Disabled due to DNS resolution failures in Edge Function environment'
WHERE name IN ('Reuters', 'CNBC Markets', 'Wall Street Journal', 'Financial Times');

-- Update broken Yahoo Finance URLs
UPDATE rss_sources 
SET url = 'https://finance.yahoo.com/news/rss/',
    last_error = NULL,
    error_count = 0
WHERE name = 'Yahoo Finance';

UPDATE rss_sources 
SET url = 'https://finance.yahoo.com/rss/',
    last_error = NULL,
    error_count = 0
WHERE name = 'Yahoo Finance News';

-- Disable access-blocked sources
UPDATE rss_sources 
SET active = false,
    last_error = 'Disabled: 403 Forbidden - blocks automated access'
WHERE name = 'Politico';

-- Add reliable alternative sources
INSERT INTO rss_sources (name, url, region, active, fetch_interval_minutes) VALUES
  -- US Market News
  ('CNBC Top News', 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664', 'AMERICAS', true, 15),
  ('CNN Business', 'http://rss.cnn.com/rss/money_latest.rss', 'AMERICAS', true, 15),
  ('AP Business News', 'https://apnews.com/apf-businessnews', 'AMERICAS', true, 15),
  
  -- Crypto (24/7 coverage)
  ('CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'GLOBAL', true, 10),
  ('Cointelegraph', 'https://cointelegraph.com/rss', 'GLOBAL', true, 10),
  
  -- International Markets
  ('Financial Times World', 'https://www.ft.com/rss/world', 'GLOBAL', true, 15),
  ('Bloomberg Markets', 'https://feeds.bloomberg.com/markets/news.rss', 'GLOBAL', true, 15),
  
  -- Economic Data
  ('St. Louis Fed News', 'https://www.stlouisfed.org/rss/news', 'AMERICAS', true, 30),
  ('ECB Press Releases', 'https://www.ecb.europa.eu/rss/press.html', 'EUROPE', true, 30),
  
  -- Tech/Corporate
  ('TechCrunch Startups', 'https://techcrunch.com/tag/startups/feed/', 'GLOBAL', true, 15),
  ('VentureBeat', 'https://venturebeat.com/feed/', 'AMERICAS', true, 20)
ON CONFLICT (url) DO NOTHING;

-- Create index for circuit breaker queries
CREATE INDEX IF NOT EXISTS idx_rss_sources_circuit_breaker 
ON rss_sources(active, error_count, last_fetched) 
WHERE active = true;

-- Create view for source health monitoring
CREATE OR REPLACE VIEW rss_source_health AS
SELECT 
  name,
  url,
  active,
  error_count,
  last_fetched,
  last_error,
  CASE 
    WHEN error_count >= 10 THEN 'CRITICAL'
    WHEN error_count >= 5 THEN 'WARNING'
    WHEN error_count > 0 THEN 'DEGRADED'
    ELSE 'HEALTHY'
  END as health_status,
  CASE 
    WHEN last_fetched IS NULL THEN 'Never fetched'
    WHEN NOW() - last_fetched > INTERVAL '1 hour' THEN 'Stale (>1h)'
    WHEN NOW() - last_fetched > INTERVAL '30 minutes' THEN 'Delayed (>30m)'
    ELSE 'Fresh'
  END as freshness,
  (SELECT COUNT(*) FROM news_items WHERE source = rss_sources.name AND published_at >= NOW() - INTERVAL '24 hours') as items_last_24h
FROM rss_sources
ORDER BY 
  CASE 
    WHEN error_count >= 10 THEN 1
    WHEN error_count >= 5 THEN 2
    WHEN error_count > 0 THEN 3
    ELSE 4
  END,
  items_last_24h DESC;
