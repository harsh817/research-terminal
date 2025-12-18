export type Region = 'AMERICAS' | 'EUROPE' | 'ASIA_PACIFIC' | 'MIDDLE_EAST' | 'AFRICA' | 'GLOBAL';
export type Market = 'EQUITIES' | 'FIXED_INCOME' | 'FX' | 'COMMODITIES' | 'CRYPTO' | 'DERIVATIVES' | 'CREDIT';
export type Theme =
  | 'MONETARY_POLICY'
  | 'FISCAL_POLICY'
  | 'EARNINGS'
  | 'M_AND_A'
  | 'GEOPOLITICS'
  | 'REGULATION'
  | 'RISK_EVENT'
  | 'ECONOMIC_DATA'
  | 'CORPORATE_ACTION'
  | 'MARKET_STRUCTURE';

interface TagRules {
  regions: { pattern: RegExp; region: Region }[];
  markets: { pattern: RegExp; market: Market }[];
  themes: { pattern: RegExp; theme: Theme }[];
}

const REGION_RULES: TagRules['regions'] = [
  { pattern: /\b(US|USA|United States|U\.S\.|American|NYSE|NASDAQ|S&P|Canada|Mexico|Brazil)\b/i, region: 'AMERICAS' },
  {
    pattern: /\b(Europe|European|EU|Eurozone|ECB|DAX|CAC|EuroStoxx|Paris|Frankfurt|Amsterdam|UK|United Kingdom|London|FTSE|British)\b/i,
    region: 'EUROPE',
  },
  {
    pattern: /\b(Asia|Asian|Hong Kong|Singapore|Tokyo|Shanghai|KOSPI|Nikkei|Hang Seng|JSX|China|Chinese|CNY|India|Australia)\b/i,
    region: 'ASIA_PACIFIC',
  },
  {
    pattern: /\b(Middle East|Saudi|UAE|Dubai|Israel|Gulf|OPEC|Oil)\b/i,
    region: 'MIDDLE_EAST',
  },
  {
    pattern: /\b(Africa|African|South Africa|Lagos|Cairo)\b/i,
    region: 'AFRICA',
  },
  { pattern: /\b(Global|Worldwide|International|World)\b/i, region: 'GLOBAL' },
];

const MARKET_RULES: TagRules['markets'] = [
  { pattern: /\b(stock|equity|equities|shares|equity market|SP500|DAX|FTSE|ASX)\b/i, market: 'EQUITIES' },
  {
    pattern: /\b(bond|bonds|fixed income|treasury|yield|curve|credit|debt|corporate bond)\b/i,
    market: 'FIXED_INCOME',
  },
  { pattern: /\b(forex|FX|currency|exchange rate|dollar|euro|pound|yen|sterling)\b/i, market: 'FX' },
  {
    pattern: /\b(commodity|commodities|oil|gold|copper|wheat|natural gas|crude|precious metal)\b/i,
    market: 'COMMODITIES',
  },
  { pattern: /\b(crypto|cryptocurrency|bitcoin|ethereum|digital asset|BTC|ETH|blockchain)\b/i, market: 'CRYPTO' },
  { pattern: /\b(derivative|derivatives|futures|options|swaps|forward)\b/i, market: 'DERIVATIVES' },
  {
    pattern: /\b(credit|credit market|CDS|spreads|high yield|junk bond|corporate credit)\b/i,
    market: 'CREDIT',
  },
];

const THEME_RULES: TagRules['themes'] = [
  {
    pattern: /\b(Fed|Federal Reserve|interest rate|rate hike|monetary policy|QE|quantitative easing)\b/i,
    theme: 'MONETARY_POLICY',
  },
  {
    pattern: /\b(fiscal stimulus|government spending|tax|budget|stimulus|infrastructure|spending bill)\b/i,
    theme: 'FISCAL_POLICY',
  },
  {
    pattern: /\b(GDP|inflation|CPI|PPI|employment|jobless|unemployment|economic data|manufacturing)\b/i,
    theme: 'ECONOMIC_DATA',
  },
  { pattern: /\b(earnings|profit|revenue|guidance|EPS|Q[1-4] result)\b/i, theme: 'EARNINGS' },
  {
    pattern: /\b(merger|acquisition|M&A|buyout|takeover|deal|IPO|spin-off|divestiture)\b/i,
    theme: 'M_AND_A',
  },
  { pattern: /\b(dividend|buyback|stock split|corporate action|shareholder)\b/i, theme: 'CORPORATE_ACTION' },
  {
    pattern: /\b(geopolitics|geopolitical|war|sanctions|conflict|trade war|tariff|political risk|crisis|oil crisis|OPEC|crude oil|natural gas|renewable|green energy)\b/i,
    theme: 'GEOPOLITICS',
  },
  {
    pattern: /\b(risk|crisis|crash|correction|drawdown|systemic|contagion|stress test|default)\b/i,
    theme: 'RISK_EVENT',
  },
  {
    pattern: /\b(regulation|regulatory|compliance|SEC|banking|antitrust|antitrust|deregulation)\b/i,
    theme: 'REGULATION',
  },
  {
    pattern: /\b(market structure|circuit breaker|trading halt|exchange|settlement|clearing|volatility surface)\b/i,
    theme: 'MARKET_STRUCTURE',
  },
];

export function tagRegion(headline: string, source: string): Region {
  const text = `${headline} ${source}`.toLowerCase();

  for (const rule of REGION_RULES) {
    if (rule.pattern.test(text)) {
      return rule.region;
    }
  }

  return 'GLOBAL';
}

export function tagMarkets(headline: string, source: string): Market[] {
  const text = `${headline} ${source}`.toLowerCase();
  const markets = new Set<Market>();

  for (const rule of MARKET_RULES) {
    if (rule.pattern.test(text)) {
      markets.add(rule.market);
      if (markets.size >= 2) break;
    }
  }

  return Array.from(markets);
}

export function tagThemes(headline: string, source: string): Theme[] {
  const text = `${headline} ${source}`.toLowerCase();
  const themes = new Set<Theme>();

  for (const rule of THEME_RULES) {
    if (rule.pattern.test(text)) {
      themes.add(rule.theme);
      if (themes.size >= 2) break;
    }
  }

  return Array.from(themes);
}

export interface TagResult {
  region: Region;
  markets: Market[];
  themes: Theme[];
}

export function classifyNewsItem(headline: string, source: string): TagResult {
  return {
    region: tagRegion(headline, source),
    markets: tagMarkets(headline, source),
    themes: tagThemes(headline, source),
  };
}
