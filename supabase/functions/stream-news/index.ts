import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function validateJWT(token: string, supabaseUrl: string, supabaseServiceRoleKey: string): Promise<{ uid: string; error?: string }> {
  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      return { uid: '', error: error?.message || 'Invalid token' };
    }

    return { uid: data.user.id };
  } catch (err) {
    return { uid: '', error: err instanceof Error ? err.message : 'Token validation failed' };
  }
}

function formatSSEMessage(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function shouldIncludeItem(item: any, paneRules: any): boolean {
  if (!paneRules) return true;

  const { regions, markets, themes, keywords, filterMode } = paneRules;

  // Keyword filtering
  const hasKeywords = keywords && keywords.length > 0;
  let matchesKeyword = true;

  if (hasKeywords) {
    const searchText = `${item.headline} ${item.source}`.toLowerCase();
    matchesKeyword = keywords.some((kw: string) =>
      searchText.includes(kw.toLowerCase())
    );
  }

  // If keywords-only mode, return keyword match result
  if (filterMode === 'keywords-only') {
    return matchesKeyword;
  }

  // Hybrid mode (default): tag filtering AND keyword filtering
  const matchesRegion = !regions || regions.length === 0 || regions.includes(item.region);
  const matchesMarket = !markets || markets.length === 0 || (item.markets || []).some((m: string) => markets.includes(m));
  const matchesTheme = !themes || themes.length === 0 || (item.themes || []).some((t: string) => themes.includes(t));

  const matchesTags = matchesRegion || matchesMarket || matchesTheme;

  return matchesTags && matchesKeyword;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.substring(7);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const { uid, error: tokenError } = await validateJWT(token, supabaseUrl, supabaseServiceRoleKey);

    if (tokenError || !uid) {
      return new Response(
        JSON.stringify({ error: tokenError || 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch all panes for filtering
    const { data: panesData } = await client.from('panes').select('*');
    const panesMap = new Map();
    if (panesData) {
      panesData.forEach((pane: any) => {
        panesMap.set(pane.id, pane.rules);
      });
    }

    // Create SSE response
    const body = new ReadableStream({
      async start(controller) {
        try {
          // Send connection confirmation
          controller.enqueue(new TextEncoder().encode(formatSSEMessage('connected', { userId: uid })));

          // Fetch recent news (last 24 hours)
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: recentNews, error: newsError } = await client
            .from('news_items')
            .select('*')
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!newsError && recentNews) {
            // Send recent news as snapshot
            const snapshot = recentNews.slice(0, 20);
            controller.enqueue(new TextEncoder().encode(formatSSEMessage('snapshot', { items: snapshot })));
          }

          // Subscribe to realtime changes
          const subscription = client
            .from('news_items')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_items' }, (payload) => {
              const newItem = payload.new;
              // Send new item to client
              controller.enqueue(new TextEncoder().encode(formatSSEMessage('news', newItem)));
            })
            .subscribe((status) => {
              if (status === 'CLOSED') {
                controller.close();
              }
            });

          // Keep connection alive with periodic keepalive events
          const keepaliveInterval = setInterval(() => {
            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'));
          }, 30000);

          // Clean up on controller close
          const originalClose = controller.close.bind(controller);
          controller.close = () => {
            clearInterval(keepaliveInterval);
            subscription.unsubscribe();
            originalClose();
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          controller.enqueue(new TextEncoder().encode(formatSSEMessage('error', { message: errorMsg })));
          controller.close();
        }
      },
    });

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
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
