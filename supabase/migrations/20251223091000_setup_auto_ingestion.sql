-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to trigger RSS ingestion
CREATE OR REPLACE FUNCTION trigger_rss_ingestion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pg_net to call the ingest-rss Edge Function
  PERFORM net.http_post(
    url := 'https://tpwervipwozezddyuizg.supabase.co/functions/v1/ingest-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Note: Supabase Free tier doesn't support pg_cron
-- Instead, you can:
-- 1. Use GitHub Actions to trigger ingestion every 5 minutes
-- 2. Use external cron service (e.g., cron-job.org)
-- 3. Upgrade to Supabase Pro for pg_cron support

-- For now, create a helper function that can be called manually or via external cron
COMMENT ON FUNCTION trigger_rss_ingestion() IS 'Call this function to manually trigger RSS ingestion, or set up external cron to call via HTTP';
