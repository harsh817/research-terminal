import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SystemStatus {
  status: 'live' | 'lagging' | 'error';
  lastIngest: string | null;
  itemsLastHour: number;
  itemsLastDay: number;
  totalItems: number;
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
      JSON.stringify({ error: 'Method not allowed. Use GET.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch system status
    const { data: statusData, error: statusError } = await client
      .from('system_status')
      .select('*')
      .eq('id', true)
      .maybeSingle();

    if (statusError) throw statusError;

    // Calculate time windows
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Count items from last hour
    const { count: itemsLastHour, error: hourError } = await client
      .from('news_items')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    if (hourError) throw hourError;

    // Count items from last day
    const { count: itemsLastDay, error: dayError } = await client
      .from('news_items')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);

    if (dayError) throw dayError;

    // Count total items
    const { count: totalItems, error: totalError } = await client
      .from('news_items')
      .select('id', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const response: SystemStatus = {
      status: statusData?.status || 'live',
      lastIngest: statusData?.last_ingest || null,
      itemsLastHour: itemsLastHour || 0,
      itemsLastDay: itemsLastDay || 0,
      totalItems: totalItems || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
