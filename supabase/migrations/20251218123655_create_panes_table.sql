/*
  # Create Panes Table

  1. New Tables
    - `panes`
      - `id` (text, primary key, pane identifier)
      - `title` (text, user-visible pane name)
      - `rules` (jsonb, rule set defining which tags route news to this pane)
      - `created_at` (timestamptz, creation timestamp)
  
  2. Security
    - Enable RLS on `panes` table
    - Add policy for authenticated users to read all panes
    - Only service role can modify panes
  
  3. Default Data
    - Insert six fixed panes:
      - Americas
      - Europe
      - Asia Pacific
      - Macro & Policy
      - Corporate
      - Risk Events
  
  4. Notes
    - Panes are static in MVP
    - Rules use jsonb to define filtering logic
    - Each pane maps to specific regions, markets, and themes
*/

CREATE TABLE IF NOT EXISTS panes (
  id text PRIMARY KEY,
  title text NOT NULL,
  rules jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE panes ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read panes
CREATE POLICY "Authenticated users can read panes"
  ON panes
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default panes
INSERT INTO panes (id, title, rules) VALUES
  (
    'americas',
    'Americas',
    '{
      "regions": ["AMERICAS"],
      "markets": ["EQUITIES", "FIXED_INCOME", "FX", "COMMODITIES"],
      "themes": []
    }'::jsonb
  ),
  (
    'europe',
    'Europe',
    '{
      "regions": ["EUROPE"],
      "markets": ["EQUITIES", "FIXED_INCOME", "FX"],
      "themes": []
    }'::jsonb
  ),
  (
    'asia_pacific',
    'Asia Pacific',
    '{
      "regions": ["ASIA_PACIFIC"],
      "markets": ["EQUITIES", "FIXED_INCOME", "FX"],
      "themes": []
    }'::jsonb
  ),
  (
    'macro_policy',
    'Macro & Policy',
    '{
      "regions": [],
      "markets": [],
      "themes": ["MONETARY_POLICY", "FISCAL_POLICY", "ECONOMIC_DATA"]
    }'::jsonb
  ),
  (
    'corporate',
    'Corporate',
    '{
      "regions": [],
      "markets": [],
      "themes": ["EARNINGS", "M_AND_A", "CORPORATE_ACTION"]
    }'::jsonb
  ),
  (
    'risk_events',
    'Risk Events',
    '{
      "regions": [],
      "markets": [],
      "themes": ["GEOPOLITICS", "REGULATION", "RISK_EVENT", "MARKET_STRUCTURE"]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;