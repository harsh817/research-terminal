import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const VALID_THEMES = [
  'GEOPOLITICS',
  'MONETARY_POLICY',
  'FISCAL_POLICY',
  'ECONOMIC_DATA',
  'EARNINGS',
  'M_AND_A',
  'CORPORATE_ACTION',
  'ENERGY',
  'RISK_EVENT',
  'REGULATION',
  'MARKET_STRUCTURE',
];

const DEFAULT_SOUND_SETTINGS = {
  enabled: true,
  volume: 0.7,
  sound_tags: ['MONETARY_POLICY', 'GEOPOLITICS', 'RISK_EVENT'],
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

async function handleGET(
  uid: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string
): Promise<Response> {
  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Try to fetch existing sound settings
    const { data, error } = await client.from('sound_settings').select('*').eq('user_id', uid).maybeSingle();

    if (error) throw error;

    if (data) {
      return new Response(
        JSON.stringify({
          user_id: uid,
          ...data,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create default sound settings if not exists
    const { data: newSettings, error: insertError } = await client
      .from('sound_settings')
      .insert([
        {
          user_id: uid,
          enabled: DEFAULT_SOUND_SETTINGS.enabled,
          volume: DEFAULT_SOUND_SETTINGS.volume,
          sound_tags: DEFAULT_SOUND_SETTINGS.sound_tags,
        },
      ])
      .select()
      .maybeSingle();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        user_id: uid,
        ...newSettings,
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
}

async function handlePOST(
  uid: string,
  body: any,
  supabaseUrl: string,
  supabaseServiceRoleKey: string
): Promise<Response> {
  try {
    // Validate input
    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'enabled must be a boolean' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (body.volume !== undefined) {
      const vol = body.volume;
      if (typeof vol !== 'number' || vol < 0 || vol > 1) {
        return new Response(
          JSON.stringify({ error: 'volume must be a number between 0 and 1' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (body.sound_tags !== undefined) {
      if (!Array.isArray(body.sound_tags)) {
        return new Response(
          JSON.stringify({ error: 'sound_tags must be an array' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      for (const tag of body.sound_tags) {
        if (!VALID_THEMES.includes(tag)) {
          return new Response(
            JSON.stringify({ error: `Invalid theme tag: ${tag}` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Upsert sound settings
    const updateData: any = {};
    if (body.enabled !== undefined) updateData.enabled = body.enabled;
    if (body.volume !== undefined) updateData.volume = body.volume;
    if (body.sound_tags !== undefined) updateData.sound_tags = body.sound_tags;

    const { data, error } = await client
      .from('sound_settings')
      .upsert([
        {
          user_id: uid,
          ...updateData,
        },
      ])
      .select()
      .maybeSingle();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        user_id: uid,
        ...data,
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
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Validate JWT
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

    // Route based on HTTP method
    if (req.method === 'GET') {
      return await handleGET(uid, supabaseUrl, supabaseServiceRoleKey);
    } else if (req.method === 'POST') {
      const body = await req.json();
      return await handlePOST(uid, body, supabaseUrl, supabaseServiceRoleKey);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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
