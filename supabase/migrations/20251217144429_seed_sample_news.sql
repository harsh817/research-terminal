/*
  # Seed Sample News Items

  ## Overview
  Creates sample news items with appropriate tags to demonstrate the terminal functionality.
  Each pane will have 3-5 sample news items to show the layout and update behavior.

  ## Notes
  - News items are timestamped with recent times
  - Mix of sound-enabled and regular tags
  - Demonstrates multi-pane appearance (news can appear in multiple panes)
*/

-- Insert sample news items
DO $$
DECLARE
  news_id_1 uuid;
  news_id_2 uuid;
  news_id_3 uuid;
  news_id_4 uuid;
  news_id_5 uuid;
  news_id_6 uuid;
  news_id_7 uuid;
  news_id_8 uuid;
BEGIN
  -- News Item 1: Fed Policy
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'Federal Reserve signals potential rate pause amid cooling inflation',
    'Reuters',
    'https://reuters.com',
    now() - interval '5 minutes'
  )
  RETURNING id INTO news_id_1;

  -- Tag it for Americas and Macro panes
  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_1, id FROM tags WHERE value IN ('Americas', 'Fed Policy', 'US Treasuries')
  ON CONFLICT DO NOTHING;

  -- News Item 2: China Economic Data
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'China Q4 GDP growth exceeds expectations at 5.4%, manufacturing output surges',
    'Bloomberg',
    'https://bloomberg.com',
    now() - interval '12 minutes'
  )
  RETURNING id INTO news_id_2;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_2, id FROM tags WHERE value IN ('China', 'Asian Equity', 'Global')
  ON CONFLICT DO NOTHING;

  -- News Item 3: ECB Policy
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'ECB maintains rates, Lagarde warns of persistent inflation risks',
    'Financial Times',
    'https://ft.com',
    now() - interval '18 minutes'
  )
  RETURNING id INTO news_id_3;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_3, id FROM tags WHERE value IN ('Europe', 'ECB Policy', 'Monetary Policy')
  ON CONFLICT DO NOTHING;

  -- News Item 4: Tech Earnings
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'Microsoft beats earnings estimates, cloud revenue up 28% year-over-year',
    'CNBC',
    'https://cnbc.com',
    now() - interval '25 minutes'
  )
  RETURNING id INTO news_id_4;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_4, id FROM tags WHERE value IN ('US', 'Earnings', 'Tech', 'Equity')
  ON CONFLICT DO NOTHING;

  -- News Item 5: Geopolitical Risk
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'Trade tensions escalate as new tariffs announced, markets assess impact',
    'Wall Street Journal',
    'https://wsj.com',
    now() - interval '32 minutes'
  )
  RETURNING id INTO news_id_5;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_5, id FROM tags WHERE value IN ('Global', 'Geopolitics', 'Volatility')
  ON CONFLICT DO NOTHING;

  -- News Item 6: M&A Activity
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'Major pharmaceutical merger announced, $45B all-cash deal expected to close Q2',
    'Bloomberg',
    'https://bloomberg.com',
    now() - interval '40 minutes'
  )
  RETURNING id INTO news_id_6;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_6, id FROM tags WHERE value IN ('M&A', 'Corporate Bonds', 'US')
  ON CONFLICT DO NOTHING;

  -- News Item 7: Japanese Markets
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'Nikkei 225 reaches new 34-year high on weak yen and tech rally',
    'Reuters',
    'https://reuters.com',
    now() - interval '48 minutes'
  )
  RETURNING id INTO news_id_7;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_7, id FROM tags WHERE value IN ('Japan', 'Asian Equity', 'Asian FX')
  ON CONFLICT DO NOTHING;

  -- News Item 8: UK Economy
  INSERT INTO news_items (headline, source, url, published_at)
  VALUES (
    'UK inflation falls to 2.1%, below Bank of England target for first time in 3 years',
    'Financial Times',
    'https://ft.com',
    now() - interval '55 minutes'
  )
  RETURNING id INTO news_id_8;

  INSERT INTO news_item_tags (news_item_id, tag_id)
  SELECT news_id_8, id FROM tags WHERE value IN ('UK', 'European Bonds', 'Inflation')
  ON CONFLICT DO NOTHING;

END $$;
