import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const RETENTION_DAYS = 10;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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

    // Calculate cutoff date (10 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISOString = cutoffDate.toISOString();

    // Fetch items to archive
    const { data: itemsToArchive, error: fetchError } = await client
      .from('news_items')
      .select('*')
      .lt('published_at', cutoffISOString);

    if (fetchError) throw fetchError;
    if (!itemsToArchive || itemsToArchive.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No items to archive',
          archived: 0,
          deleted: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert into news_archive
    const { error: insertError } = await client.from('news_archive').insert(itemsToArchive);

    if (insertError) throw insertError;

    // Delete from news_items
    const { error: deleteError } = await client
      .from('news_items')
      .delete()
      .lt('published_at', cutoffISOString);

    if (deleteError) throw deleteError;

    // Log archival
    const { error: logError } = await client.from('ingestion_logs').insert([
      {
        feed_id: null,
        status: 'success',
        items_fetched: itemsToArchive.length,
        error_message: null,
      },
    ]);

    if (logError) {
      console.warn('Failed to log archival:', logError);
    }

    return new Response(
      JSON.stringify({
        message: 'Archive completed successfully',
        archived: itemsToArchive.length,
        cutoffDate: cutoffISOString,
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
