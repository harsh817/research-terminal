import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RSSSource {
  id: string;
  name: string;
  url: string;
  region: string;
  active: boolean;
}

interface NewsItem {
  headline: string;
  source: string;
  url: string;
  published_at: string;
  region: string;
  markets: string[];
  themes: string[];
  hash: string;
}

async function fetchRSSFeed(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Research Terminal RSS Reader/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseXML(xml: string): Array<{ title?: string; link?: string; pubDate?: string }> {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const items = [];

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemXml);
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemXml);
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemXml);

    items.push({
      title: titleMatch ? cleanText(titleMatch[1]) : '',
      link: linkMatch ? cleanText(linkMatch[1]) : '',
      pubDate: pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString(),
    });
  }

  return items;
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function generateHash(headline: string, source: string): string {
  const normalized = `${headline.toLowerCase().trim()}||${source.toLowerCase().trim()}`;
  // Use built-in crypto for hash
  return btoa(normalized).substring(0, 64); // Simplified hash for Deno
}

function tagRegion(headline: string, source: string): string {
  const text = `${headline} ${source}`.toLowerCase();

  if (/\b(US|USA|United States|U\.S\.|American|NYSE|NASDAQ)\b/.test(text)) return 'US';
  if (/\b(UK|United Kingdom|London|FTSE|British)\b/.test(text)) return 'UK';
  if (/\b(Europe|European|EU|Eurozone|ECB|DAX)\b/.test(text)) return 'EUROPE';
  if (/\b(Asia|Asian|Hong Kong|Singapore|Tokyo)\b/.test(text)) return 'ASIA_PACIFIC';
  if (/\b(China|Chinese|Beijing|Shanghai|CNY)\b/.test(text)) return 'CHINA';
  if (/\b(Emerging Markets|EM|Brazil|Mexico|India)\b/.test(text)) return 'EMERGING_MARKETS';

  return 'GLOBAL';
}

function tagMarkets(headline: string, source: string): string[] {
  const text = `${headline} ${source}`.toLowerCase();
  const markets: string[] = [];

  if (/\b(stock|equity|shares|SP500|DAX)\b/.test(text)) markets.push('EQUITIES');
  if (/\b(bond|fixed income|treasury|yield)\b/.test(text)) markets.push('FIXED_INCOME');
  if (/\b(forex|FX|currency|dollar|euro)\b/.test(text)) markets.push('FX');
  if (/\b(commodity|oil|gold|copper|wheat)\b/.test(text)) markets.push('COMMODITIES');
  if (/\b(crypto|bitcoin|ethereum|blockchain)\b/.test(text)) markets.push('CRYPTO');
  if (/\b(credit|CDS|spreads|high yield)\b/.test(text)) markets.push('CREDIT');

  return markets.slice(0, 2);
}

function tagThemes(headline: string, source: string): string[] {
  const text = `${headline} ${source}`.toLowerCase();
  const themes: string[] = [];

  if (/\b(Fed|interest rate|monetary policy|QE)\b/.test(text)) themes.push('MONETARY_POLICY');
  if (/\b(fiscal stimulus|government spending|tax|budget)\b/.test(text)) themes.push('FISCAL_POLICY');
  if (/\b(GDP|inflation|CPI|employment|jobless)\b/.test(text)) themes.push('ECONOMIC_DATA');
  if (/\b(earnings|profit|revenue|guidance|EPS)\b/.test(text)) themes.push('EARNINGS');
  if (/\b(merger|acquisition|M&A|buyout|IPO)\b/.test(text)) themes.push('M_AND_A');
  if (/\b(geopolitics|war|sanctions|conflict|tariff)\b/.test(text)) themes.push('GEOPOLITICS');
  if (/\b(energy crisis|oil crisis|OPEC|renewable)\b/.test(text)) themes.push('ENERGY');
  if (/\b(risk|crisis|crash|correction|systemic)\b/.test(text)) themes.push('RISK_EVENT');
  if (/\b(regulation|regulatory|compliance|SEC)\b/.test(text)) themes.push('REGULATION');

  return themes.slice(0, 2);
}

async function processRSSFeed(
  client: any,
  source: RSSSource
): Promise<{ success: number; failed: number; error?: string }> {
  try {
    const xml = await fetchRSSFeed(source.url);
    const items = parseXML(xml);

    let inserted = 0;

    for (const item of items) {
      if (!item.title || !item.link) continue;

      const hash = generateHash(item.title, source.name);
      const region = tagRegion(item.title, source.name);
      const markets = tagMarkets(item.title, source.name);
      const themes = tagThemes(item.title, source.name);

      const newsItem: NewsItem = {
        headline: item.title,
        source: source.name,
        url: item.link,
        published_at: normalizeDate(item.pubDate || new Date().toISOString()),
        region,
        markets,
        themes,
        hash,
      };

      const { error } = await client.from('news_items').insert([newsItem]).select();

      if (!error) {
        inserted++;
      }
    }

    // Log ingestion result
    await client.from('ingestion_logs').insert([
      {
        feed_id: source.id,
        status: 'success',
        items_fetched: inserted,
        error_message: null,
      },
    ]);

    return { success: inserted, failed: items.length - inserted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Log failure
    await client.from('ingestion_logs').insert([
      {
        feed_id: source.id,
        status: 'failed',
        items_fetched: 0,
        error_message: errorMsg,
      },
    ]);

    return { success: 0, failed: 0, error: errorMsg };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate internal secret
    const internalSecret = Deno.env.get('INTERNAL_CRON_SECRET');
    const authHeader = req.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!internalSecret || providedSecret !== internalSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or missing internal secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch all active RSS sources
    const { data: sources, error: sourcesError } = await client
      .from('rss_sources')
      .select('*')
      .eq('active', true);

    if (sourcesError) throw sourcesError;
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active RSS sources configured' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Process each feed
    const results = [];
    let totalInserted = 0;
    let totalFailed = 0;

    for (const source of sources as RSSSource[]) {
      const result = await processRSSFeed(client, source);
      results.push({ source: source.name, ...result });
      totalInserted += result.success;
      totalFailed += result.failed;
    }

    // Update system status
    const status =
      results.every((r) => !r.error) ? 'live' : results.some((r) => r.error) ? 'partial' : 'error';

    await client.from('system_status').update({ last_ingest: new Date().toISOString(), status }).eq('id', true);

    return new Response(
      JSON.stringify({
        message: 'Ingestion completed',
        totalInserted,
        totalFailed,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
