/*
  # Seed Sample News Data
  
  1. New Data
    - Add 20+ sample news items across different regions, markets, and themes
    - Representative headlines from major financial sources
    - Mix of Americas, Europe, and Asia Pacific content
    - Various market categories and themes for testing pane filtering
  
  2. Purpose
    - Provide initial data for testing the terminal interface
    - Demonstrate pane filtering functionality
    - Enable real-time update testing
*/

INSERT INTO news_items (headline, source, url, published_at, region, markets, themes, hash) VALUES
  ('Fed Signals Pause in Rate Hikes Amid Banking Sector Concerns', 'Bloomberg', 'https://bloomberg.com/news/fed-signals-pause', NOW() - INTERVAL '5 minutes', 'AMERICAS', ARRAY['FIXED_INCOME']::market_t[], ARRAY['MONETARY_POLICY']::theme_t[], 'hash_001'),
  
  ('Apple Reports Record Quarter Despite Supply Chain Challenges', 'Reuters', 'https://reuters.com/technology/apple-earnings', NOW() - INTERVAL '10 minutes', 'AMERICAS', ARRAY['EQUITIES']::market_t[], ARRAY['EARNINGS']::theme_t[], 'hash_002'),
  
  ('ECB Raises Rates by 50bps, More Hikes Expected', 'Financial Times', 'https://ft.com/content/ecb-rates', NOW() - INTERVAL '15 minutes', 'EUROPE', ARRAY['FIXED_INCOME']::market_t[], ARRAY['MONETARY_POLICY']::theme_t[], 'hash_003'),
  
  ('Gold Surges to $2,100 as Dollar Weakens', 'CNBC', 'https://cnbc.com/markets/gold-surge', NOW() - INTERVAL '20 minutes', 'GLOBAL', ARRAY['COMMODITIES', 'FX']::market_t[], ARRAY['MARKET_STRUCTURE']::theme_t[], 'hash_004'),
  
  ('China GDP Growth Beats Expectations at 5.2%', 'WSJ', 'https://wsj.com/articles/china-gdp', NOW() - INTERVAL '25 minutes', 'ASIA_PACIFIC', ARRAY['EQUITIES']::market_t[], ARRAY['ECONOMIC_DATA']::theme_t[], 'hash_005'),
  
  ('JPMorgan to Acquire First Republic Bank Assets', 'Bloomberg', 'https://bloomberg.com/news/jpmorgan-first-republic', NOW() - INTERVAL '30 minutes', 'AMERICAS', ARRAY['EQUITIES']::market_t[], ARRAY['M_AND_A']::theme_t[], 'hash_006'),
  
  ('UK Inflation Falls to 3.2%, Below BOE Target', 'Reuters', 'https://reuters.com/world/uk/inflation', NOW() - INTERVAL '35 minutes', 'EUROPE', ARRAY['FIXED_INCOME']::market_t[], ARRAY['ECONOMIC_DATA']::theme_t[], 'hash_007'),
  
  ('Tesla Announces New Gigafactory in Mexico', 'CNBC', 'https://cnbc.com/tesla-gigafactory', NOW() - INTERVAL '40 minutes', 'AMERICAS', ARRAY['EQUITIES']::market_t[], ARRAY['CORPORATE_ACTION']::theme_t[], 'hash_008'),
  
  ('Yen Weakens Past 150 as BOJ Maintains Yield Curve Control', 'Bloomberg', 'https://bloomberg.com/news/yen-weakens', NOW() - INTERVAL '45 minutes', 'ASIA_PACIFIC', ARRAY['FX']::market_t[], ARRAY['MONETARY_POLICY']::theme_t[], 'hash_009'),
  
  ('SEC Proposes New Crypto Custody Rules', 'WSJ', 'https://wsj.com/articles/sec-crypto', NOW() - INTERVAL '50 minutes', 'AMERICAS', ARRAY['CRYPTO']::market_t[], ARRAY['REGULATION']::theme_t[], 'hash_010'),
  
  ('Germany Avoids Recession with 0.1% GDP Growth', 'Financial Times', 'https://ft.com/content/germany-gdp', NOW() - INTERVAL '55 minutes', 'EUROPE', ARRAY['EQUITIES']::market_t[], ARRAY['ECONOMIC_DATA']::theme_t[], 'hash_011'),
  
  ('OPEC+ Announces Surprise Production Cut', 'Reuters', 'https://reuters.com/business/energy/opec-cut', NOW() - INTERVAL '60 minutes', 'MIDDLE_EAST', ARRAY['COMMODITIES']::market_t[], ARRAY['GEOPOLITICS']::theme_t[], 'hash_012'),
  
  ('Microsoft-Activision Deal Clears Final Regulatory Hurdle', 'CNBC', 'https://cnbc.com/microsoft-activision', NOW() - INTERVAL '65 minutes', 'AMERICAS', ARRAY['EQUITIES']::market_t[], ARRAY['M_AND_A', 'REGULATION']::theme_t[], 'hash_013'),
  
  ('Australian Central Bank Holds Rates Steady at 4.1%', 'Bloomberg', 'https://bloomberg.com/news/rba-rates', NOW() - INTERVAL '70 minutes', 'ASIA_PACIFIC', ARRAY['FIXED_INCOME']::market_t[], ARRAY['MONETARY_POLICY']::theme_t[], 'hash_014'),
  
  ('US Crude Inventory Falls More Than Expected', 'Reuters', 'https://reuters.com/markets/commodities/oil-inventory', NOW() - INTERVAL '75 minutes', 'AMERICAS', ARRAY['COMMODITIES']::market_t[], ARRAY['ECONOMIC_DATA']::theme_t[], 'hash_015'),
  
  ('European Banks Pass Stress Test with Strong Capital Buffers', 'Financial Times', 'https://ft.com/content/eu-stress-test', NOW() - INTERVAL '80 minutes', 'EUROPE', ARRAY['EQUITIES', 'FIXED_INCOME']::market_t[], ARRAY['RISK_EVENT']::theme_t[], 'hash_016'),
  
  ('Nvidia Earnings Smash Estimates on AI Chip Demand', 'CNBC', 'https://cnbc.com/nvidia-earnings', NOW() - INTERVAL '85 minutes', 'AMERICAS', ARRAY['EQUITIES']::market_t[], ARRAY['EARNINGS']::theme_t[], 'hash_017'),
  
  ('China Evergrande Files for Bankruptcy Protection in US', 'WSJ', 'https://wsj.com/articles/evergrande-bankruptcy', NOW() - INTERVAL '90 minutes', 'ASIA_PACIFIC', ARRAY['EQUITIES', 'FIXED_INCOME']::market_t[], ARRAY['RISK_EVENT']::theme_t[], 'hash_018'),
  
  ('Senate Passes Debt Ceiling Bill, Avoiding Default', 'Reuters', 'https://reuters.com/world/us/debt-ceiling', NOW() - INTERVAL '95 minutes', 'AMERICAS', ARRAY['FIXED_INCOME']::market_t[], ARRAY['FISCAL_POLICY']::theme_t[], 'hash_019'),
  
  ('India Central Bank Intervenes to Support Rupee', 'Bloomberg', 'https://bloomberg.com/news/india-rbi', NOW() - INTERVAL '100 minutes', 'ASIA_PACIFIC', ARRAY['FX']::market_t[], ARRAY['MONETARY_POLICY']::theme_t[], 'hash_020')

ON CONFLICT (hash) DO NOTHING;
