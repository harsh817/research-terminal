/*
  # Seed Initial RSS Sources (Corrected)

  1. Initial Data
    - Adds 12 real financial/business RSS feeds
    - Each feed classified by region using correct enum values
    - All set to active by default

  2. Feeds Included
    - Bloomberg
    - Reuters
    - Financial Times
    - Wall Street Journal
    - CNBC
    - MarketWatch
    - Yahoo Finance
    - The Economist
    - Seeking Alpha
    - Business Insider
    - TechCrunch
    - Politico
*/

INSERT INTO rss_sources (name, url, region, active)
VALUES
  -- Americas Markets & Business
  ('Bloomberg', 'https://feeds.bloomberg.com/markets/news.rss', 'AMERICAS', true),
  ('CNBC Markets', 'https://feeds.cnbc.com/cnbc/markets/', 'AMERICAS', true),
  ('Wall Street Journal', 'https://feeds.wsj.com/xml/rss/3_7085.xml', 'AMERICAS', true),
  ('MarketWatch', 'https://feeds.marketwatch.com/marketwatch/topstories/', 'AMERICAS', true),
  
  -- European Markets
  ('Financial Times', 'http://feeds.ft.com/ft/home/uk', 'EUROPE', true),
  ('Reuters', 'https://feeds.reuters.com/reuters/businessNews', 'GLOBAL', true),
  
  -- Technology & Innovation
  ('TechCrunch', 'http://feeds.feedburner.com/TechCrunch/', 'AMERICAS', true),
  ('Business Insider', 'http://feeds.businessinsider.com/bi/frontpage', 'AMERICAS', true),
  
  -- Economics & Policy
  ('The Economist', 'https://www.economist.com/finance-and-economics/rss.xml', 'GLOBAL', true),
  ('Politico', 'https://www.politico.com/rss/politicopro.xml', 'AMERICAS', true),
  
  -- Alternative Investment
  ('Seeking Alpha', 'https://feeds.seekingalpha.com/feed/news.xml', 'AMERICAS', true),
  ('Yahoo Finance', 'https://finance.yahoo.com/news/feed', 'AMERICAS', true)
ON CONFLICT (url) DO NOTHING;