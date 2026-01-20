/*
  # Add Keyword Filtering to Panes

  1. Changes
    - Add `keywords` array to panes.rules JSONB column
    - Add `filterMode` to panes.rules JSONB column (hybrid | keywords-only)
    - Populate initial keywords for each pane

  2. Filter Modes
    - `hybrid` (default): News must match BOTH tag rules AND keywords (AND logic)
    - `keywords-only`: News matches keywords only, ignoring tag rules

  3. Initial Keywords
    - Americas: Fed, FOMC, Powell, Treasury, S&P, Nasdaq, Dow, Wall Street, dollar
    - Europe: ECB, Lagarde, EU, Brexit, DAX, FTSE, euro, eurozone, Bank of England
    - Asia Pacific: PBOC, BOJ, Nikkei, Hang Seng, yuan, yen, China, Japan, RBA
    - Macro & Policy: inflation, CPI, GDP, rate hike, rate cut, QE, quantitative, fiscal stimulus, interest rate
    - Corporate: earnings, EPS, revenue, merger, acquisition, IPO, buyback, dividend, guidance
    - Risk Events: crisis, crash, sanctions, war, conflict, volatility, VIX, default, regulation, SEC
*/

-- Update Americas pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["Fed", "FOMC", "Powell", "Treasury", "S&P", "Nasdaq", "Dow", "Wall Street", "dollar"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'americas';

-- Update Europe pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["ECB", "Lagarde", "EU", "Brexit", "DAX", "FTSE", "euro", "eurozone", "Bank of England"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'europe';

-- Update Asia Pacific pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["PBOC", "BOJ", "Nikkei", "Hang Seng", "yuan", "yen", "China", "Japan", "RBA"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'asia_pacific';

-- Update Macro & Policy pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["inflation", "CPI", "GDP", "rate hike", "rate cut", "QE", "quantitative", "fiscal stimulus", "interest rate"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'macro_policy';

-- Update Corporate pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["earnings", "EPS", "revenue", "merger", "acquisition", "IPO", "buyback", "dividend", "guidance"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'corporate';

-- Update Risk Events pane
UPDATE panes
SET rules = jsonb_set(
  jsonb_set(
    rules,
    '{keywords}',
    '["crisis", "crash", "sanctions", "war", "conflict", "volatility", "VIX", "default", "regulation", "SEC"]'::jsonb
  ),
  '{filterMode}',
  '"hybrid"'::jsonb
)
WHERE id = 'risk_events';
