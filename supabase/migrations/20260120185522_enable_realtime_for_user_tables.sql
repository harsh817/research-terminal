-- Enable Realtime for user_read_items and user_saved_items tables
-- This allows the application to receive real-time updates when users
-- mark items as read or save items as bookmarks

-- Enable Realtime replication for user_read_items table
ALTER TABLE public.user_read_items REPLICA IDENTITY FULL;

-- Enable Realtime replication for user_saved_items table  
ALTER TABLE public.user_saved_items REPLICA IDENTITY FULL;

-- Grant necessary permissions for Realtime to work
GRANT SELECT ON public.user_read_items TO anon, authenticated;
GRANT SELECT ON public.user_saved_items TO anon, authenticated;

-- Add tables to the realtime publication so postgres_changes subscriptions work
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_read_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_saved_items;
