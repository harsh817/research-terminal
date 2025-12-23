// Updated Dec 22, 2025
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-cron-secret',
};

interface RSSSource {
  id: string;
  name: string;
  url: string;
  region: string;
  active: boolean;
  last_fetched?: string;
  last_modified?: string;
  etag?: string;
  fetch_interval_minutes?: number;
  last_error?: string;
  error_count?: number;
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
  summary?: string;
}

interface ParsedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string;
}

async function fetchRSSFeed(url: string, source: RSSSource): Promise<{ xml: string; headers: Headers }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Research Terminal RSS Reader/1.0',
    };

    // Add conditional GET headers if we have cached values
    if (source.etag) {
      headers['If-None-Match'] = source.etag;
    }
    if (source.last_modified) {
      headers['If-Modified-Since'] = source.last_modified;
    }

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 304) {
      // Not modified, return empty to indicate no new content
      return { xml: '', headers: response.headers };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    return { xml, headers: response.headers };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds');
    }
    throw error;
  }
}

function parseXML(xml: string): ParsedItem[] {
  if (!xml || xml.trim() === '') {
    return [];
  }

  const items: ParsedItem[] = [];

  try {
    // Check if it's Atom or RSS
    const isAtom = xml.includes('<feed') || xml.includes('<entry>');

    if (isAtom) {
      return parseAtomXML(xml);
    } else {
      return parseRSSXML(xml);
    }
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
}

function parseRSSXML(xml: string): ParsedItem[] {
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const items: ParsedItem[] = [];

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemXml);
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemXml);
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemXml);
    const descriptionMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemXml);
    const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(itemXml);

    items.push({
      title: titleMatch ? cleanText(titleMatch[1]) : '',
      link: linkMatch ? cleanText(linkMatch[1]) : '',
      pubDate: pubDateMatch ? cleanText(pubDateMatch[1]) : '',
      description: descriptionMatch ? cleanText(descriptionMatch[1]) : '',
      guid: guidMatch ? cleanText(guidMatch[1]) : '',
    });
  }

  return items;
}

function parseAtomXML(xml: string): ParsedItem[] {
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  const items: ParsedItem[] = [];

  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(entryXml);
    const linkMatch = /<link[^>]*href="([^"]*)"[^>]*>/i.exec(entryXml);
    const publishedMatch = /<(?:published|updated)[^>]*>([\s\S]*?)<\/(?:published|updated)>/i.exec(entryXml);
    const summaryMatch = /<summary[^>]*>([\s\S]*?)<\/summary>/i.exec(entryXml);
    const contentMatch = /<content[^>]*>([\s\S]*?)<\/content>/i.exec(entryXml);
    const idMatch = /<id[^>]*>([\s\S]*?)<\/id>/i.exec(entryXml);

    items.push({
      title: titleMatch ? cleanText(titleMatch[1]) : '',
      link: linkMatch ? linkMatch[1] : '',
      pubDate: publishedMatch ? cleanText(publishedMatch[1]) : '',
      description: summaryMatch ? cleanText(summaryMatch[1]) : contentMatch ? cleanText(contentMatch[1]) : '',
      guid: idMatch ? cleanText(idMatch[1]) : '',
    });
  }

  return items;
}

function cleanText(text: string): string {
  let out = text.replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  // Decode numeric HTML entities (decimal and hex), e.g. &#8217; or &#x2019;
  out = out.replace(/&#x([0-9A-Fa-f]+);/g, (_m, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return '';
    }
  });

  out = out.replace(/&#(\d+);/g, (_m, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch {
      return '';
    }
  });

  return out;
}

function normalizeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function generateHash(headline: string, source: string, dedupeKey?: string): string {
  const normalized = dedupeKey || `${headline.toLowerCase().trim()}||${source.toLowerCase().trim()}`;
  // Use built-in crypto for hash
  return btoa(normalized).substring(0, 64); // Simplified hash for Deno
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
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
): Promise<{ success: number; failed: number; error?: string; notModified?: boolean }> {
  try {
    // Check if we should skip this feed based on interval
    if (source.last_fetched && source.fetch_interval_minutes) {
      const lastFetched = new Date(source.last_fetched);
      const now = new Date();
      const minutesSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60);

      if (minutesSinceLastFetch < source.fetch_interval_minutes) {
        return { success: 0, failed: 0, notModified: true };
      }
    }

    const { xml, headers } = await fetchRSSFeed(source.url, source);

    // If 304 Not Modified, just update the last_fetched time
    if (xml === '') {
      await client.from('rss_sources').update({
        last_fetched: new Date().toISOString(),
        error_count: 0,
        last_error: null,
      }).eq('id', source.id);

      return { success: 0, failed: 0, notModified: true };
    }

    const items = parseXML(xml);
    let inserted = 0;

    for (const item of items) {
      if (!item.title || !item.link) continue;

      // Use GUID or link+timestamp for deduplication
      const dedupeKey = item.guid || `${item.link}-${item.pubDate}`;
      const hash = generateHash(item.title, source.name, dedupeKey);

      let region = tagRegion(item.title, source.name);
      let markets = tagMarkets(item.title, source.name);
      let themes = tagThemes(item.title, source.name);

      // BBC filtering for Americas relevance
      const isBBC = source.name === 'BBC World News';
      if (isBBC) {
        const content = `${item.title} ${item.description || ''}`.toLowerCase();
        const keywords = {
          americas: ['us', 'america', 'united states', 'wall street', 'fed', 'federal reserve'],
          equities: ['stocks', 'equity', 'shares', 'nasdaq', 'nyse'],
          fixedIncome: ['bonds', 'treasury', 'yield'],
          fx: ['dollar', 'usd', 'currency'],
          commodities: ['oil', 'gold', 'commodity']
        };

        // Check for Americas relevance
        const hasAmericas = keywords.americas.some(kw => content.includes(kw));
        if (hasAmericas) {
          region = 'AMERICAS';
          markets = [];
          // Assign markets based on keywords
          if (keywords.equities.some(kw => content.includes(kw))) markets.push('EQUITIES');
          if (keywords.fixedIncome.some(kw => content.includes(kw))) markets.push('FIXED_INCOME');
          if (keywords.fx.some(kw => content.includes(kw))) markets.push('FX');
          if (keywords.commodities.some(kw => content.includes(kw))) markets.push('COMMODITIES');
        }
      }

      const newsItem: NewsItem = {
        headline: item.title,
        source: source.name,
        url: item.link,
        published_at: normalizeDate(item.pubDate || new Date().toISOString()),
        region,
        markets,
        themes,
        hash,
        summary: item.description ? truncateText(item.description, 500) : undefined,
      };

      const { error } = await client.from('news_items').insert([newsItem]).select();

      if (!error) {
        inserted++;
      }
    }

    // Update source with new caching info
    const updateData: any = {
      last_fetched: new Date().toISOString(),
      error_count: 0,
      last_error: null,
    };

    const etag = headers.get('etag');
    const lastModified = headers.get('last-modified');

    if (etag) updateData.etag = etag;
    if (lastModified) updateData.last_modified = lastModified;

    await client.from('rss_sources').update(updateData).eq('id', source.id);

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

    // Update error tracking
    const newErrorCount = (source.error_count || 0) + 1;
    await client.from('rss_sources').update({
      last_error: errorMsg,
      error_count: newErrorCount,
      last_fetched: new Date().toISOString(),
    }).eq('id', source.id);

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
  console.log('Function called with method:', req.method);
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate cron secret for security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('INTERNAL_CRON_SECRET');
    
    if (expectedSecret && cronSecret !== expectedSecret) {
      console.error('❌ Invalid cron secret provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid cron secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('✅ Cron secret validated successfully');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role key to bypass RLS for ingestion
    const client = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active RSS sources
    const { data: sources, error: sourcesError } = await client
      .from('rss_sources')
      .select('id, name, url, region, active, last_fetched, last_modified, etag, fetch_interval_minutes, last_error, error_count')
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
    let totalSkipped = 0;

    for (const source of sources as RSSSource[]) {
      const result = await processRSSFeed(client, source);
      results.push({
        source: source.name,
        ...result,
        skipped: result.notModified ? 1 : 0
      });
      totalInserted += result.success;
      totalFailed += result.failed;
      if (result.notModified) totalSkipped++;
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
        totalSkipped,
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
