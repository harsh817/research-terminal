/*
  # Add BBC World News RSS Feed

  Adds the BBC World News RSS feed to rss_sources table.
  Region set to GLOBAL as it's world news.
*/

INSERT INTO rss_sources (name, url, region, active)
VALUES ('BBC World News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'GLOBAL', true)
ON CONFLICT (url) DO NOTHING;