/*
  # Seed Initial Tags

  ## Overview
  Populates the tags table with initial tag values for all six panes.

  ## Tag Distribution

  ### Pane 1: Americas
  - Region: Americas (sound enabled for critical events)
  - Markets: Equity, Fixed Income, FX
  - Themes: Monetary Policy (sound), Geopolitics (sound), Corporate

  ### Pane 2: Europe
  - Region: Europe (sound enabled)
  - Markets: Equity, Fixed Income, FX
  - Themes: Monetary Policy (sound), Geopolitics (sound), Corporate

  ### Pane 3: Asia Pacific
  - Region: Asia Pacific (sound enabled)
  - Markets: Equity, Fixed Income, FX
  - Themes: Monetary Policy (sound), Geopolitics (sound), Corporate

  ### Pane 4: Macro & Policy
  - Region: Global
  - Markets: Rates, Credit
  - Themes: Monetary Policy (sound), Fiscal Policy (sound), Central Banks (sound)

  ### Pane 5: Corporate
  - Region: Global
  - Markets: Equity, Credit
  - Themes: Earnings, M&A, Corporate Governance

  ### Pane 6: Risk Events
  - Region: Global
  - Markets: All
  - Themes: Geopolitics (sound), Crisis (sound), Volatility (sound)
*/

-- Insert tags only if they don't already exist
INSERT INTO tags (type, value, sound_enabled, pane_assignment)
VALUES
  -- Americas Pane
  ('region', 'Americas', true, 'americas'),
  ('region', 'US', false, 'americas'),
  ('region', 'Canada', false, 'americas'),
  ('region', 'Latin America', false, 'americas'),
  ('market', 'US Equity', false, 'americas'),
  ('market', 'US Treasuries', false, 'americas'),
  ('theme', 'Fed Policy', true, 'americas'),
  
  -- Europe Pane
  ('region', 'Europe', true, 'europe'),
  ('region', 'UK', false, 'europe'),
  ('region', 'Eurozone', false, 'europe'),
  ('market', 'European Equity', false, 'europe'),
  ('market', 'European Bonds', false, 'europe'),
  ('theme', 'ECB Policy', true, 'europe'),
  ('theme', 'Brexit', false, 'europe'),
  
  -- Asia Pacific Pane
  ('region', 'Asia Pacific', true, 'asia_pacific'),
  ('region', 'China', false, 'asia_pacific'),
  ('region', 'Japan', false, 'asia_pacific'),
  ('region', 'Australia', false, 'asia_pacific'),
  ('market', 'Asian Equity', false, 'asia_pacific'),
  ('market', 'Asian FX', false, 'asia_pacific'),
  ('theme', 'PBOC Policy', true, 'asia_pacific'),
  ('theme', 'BOJ Policy', true, 'asia_pacific'),
  
  -- Macro & Policy Pane
  ('region', 'Global', false, 'macro_policy'),
  ('market', 'Rates', false, 'macro_policy'),
  ('market', 'Credit', false, 'macro_policy'),
  ('market', 'FX', false, 'macro_policy'),
  ('theme', 'Monetary Policy', true, 'macro_policy'),
  ('theme', 'Fiscal Policy', true, 'macro_policy'),
  ('theme', 'Central Banks', true, 'macro_policy'),
  ('theme', 'Inflation', false, 'macro_policy'),
  
  -- Corporate Pane
  ('market', 'Equity', false, 'corporate'),
  ('market', 'Corporate Bonds', false, 'corporate'),
  ('theme', 'Earnings', false, 'corporate'),
  ('theme', 'M&A', false, 'corporate'),
  ('theme', 'Corporate Governance', false, 'corporate'),
  ('theme', 'Tech', false, 'corporate'),
  
  -- Risk Events Pane
  ('market', 'Volatility', false, 'risk_events'),
  ('theme', 'Geopolitics', true, 'risk_events'),
  ('theme', 'Crisis', true, 'risk_events'),
  ('theme', 'Market Stress', true, 'risk_events'),
  ('theme', 'Regulation', false, 'risk_events')
ON CONFLICT (type, value) DO NOTHING;
