-- Seed RSS Sources (Verified Working as of Dec 23, 2025)
-- 8 feeds, 187 total items available

INSERT INTO rss_sources (url, name, region, active) VALUES
  ('https://feeds.marketwatch.com/marketwatch/topstories/', 'MarketWatch Top Stories', 'AMERICAS', true),
  ('https://feeds.marketwatch.com/marketwatch/marketpulse/', 'MarketWatch Market Pulse', 'AMERICAS', true),
  ('https://finance.yahoo.com/news/rssindex', 'Yahoo Finance News', 'AMERICAS', true),
  ('https://seekingalpha.com/feed.xml', 'Seeking Alpha Latest', 'AMERICAS', true),
  ('https://www.federalreserve.gov/feeds/press_all.xml', 'Federal Reserve Press', 'AMERICAS', true),
  ('https://www.investing.com/rss/news.rss', 'Investing.com General', 'GLOBAL', true),
  ('https://www.ft.com/companies?format=rss', 'FT Companies', 'GLOBAL', true),
  ('https://feeds.a.dj.com/rss/RSSMarketsMain.xml', 'WSJ Markets', 'AMERICAS', true)
ON CONFLICT (url) DO NOTHING;
