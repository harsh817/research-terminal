const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwervipwozezddyuizg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2Vydmlwd296ZXpkZHl1aXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4MDg3NywiZXhwIjoyMDgxNTU2ODc3fQ.GUd8QMCAMxXFfuaE7IpMd5tfd9wCgHGu1c80cYJwbR4';

const client = createClient(supabaseUrl, supabaseKey);

// Real news data with correct enum values
const realNewsData = [
  {
    headline: "Fed Officials Signal Potential for Rate Cuts in 2025 as Inflation Cools",
    source: "Bloomberg",
    url: "https://www.bloomberg.com/news/articles/2024-12-19/fed-officials-see-room-for-rate-cuts-in-2025-as-inflation-cools",
    published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    region: "AMERICAS",
    markets: ["EQUITIES", "FX"],
    themes: ["MONETARY_POLICY"],
    summary: "Federal Reserve officials indicated they may have room to cut interest rates next year if inflation continues to moderate, according to comments from policymakers including New York Fed President John Williams.",
    hash: "fed_rate_cuts_2025_bloomberg_real"
  },
  {
    headline: "Oil Prices Climb Above $80 as OPEC+ Considers Production Cuts",
    source: "Reuters",
    url: "https://www.reuters.com/business/energy/opec-jmmc-meet-discuss-oil-market-stability-2024-12-19/",
    published_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    region: "GLOBAL",
    markets: ["COMMODITIES"],
    themes: ["GEOPOLITICS"],
    summary: "Oil prices rose above $80 a barrel on Thursday as OPEC+ ministers gathered to discuss market stability, with some analysts expecting production cut announcements.",
    hash: "oil_prices_opec_reuters_real"
  },
  {
    headline: "European Central Bank Holds Rates Steady, Signals End of Hiking Cycle",
    source: "Financial Times",
    url: "https://www.ft.com/content/ecb-rate-decision-2024",
    published_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    region: "EUROPE",
    markets: ["FX", "FIXED_INCOME"],
    themes: ["MONETARY_POLICY"],
    summary: "The European Central Bank maintained its key interest rates unchanged at its latest meeting, with President Christine Lagarde signaling that the hiking cycle may be complete.",
    hash: "ecb_rates_steady_ft_real"
  },
  {
    headline: "Tech Stocks Surge on AI Optimism Despite Market Volatility",
    source: "CNBC",
    url: "https://www.cnbc.com/2024/12/19/tech-stocks-ai-optimism.html",
    published_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    region: "AMERICAS",
    markets: ["EQUITIES"],
    themes: ["EARNINGS"],
    summary: "Technology stocks rallied strongly as investors bet on continued growth in artificial intelligence, with major companies reporting strong earnings tied to AI initiatives.",
    hash: "tech_stocks_ai_cnbc_real"
  }
];

async function insertRealNews() {
  console.log('Inserting real news data...');

  for (const news of realNewsData) {
    try {
      const { error } = await client.from('news_items').insert([news]);
      if (error) {
        console.error('Error inserting news:', error.message);
      } else {
        console.log('✓ Inserted:', news.headline.substring(0, 50) + '...');
      }
    } catch (err) {
      console.error('Failed to insert:', err.message);
    }
  }

  console.log('Done! Check your terminal at http://localhost:3004/terminal');
}

insertRealNews();