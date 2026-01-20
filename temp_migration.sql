CREATE TABLE IF NOT EXISTS user_saved_items (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  news_item_id uuid NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, news_item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_items_user_id ON user_saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_items_news_item_id ON user_saved_items(news_item_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_items_saved_at ON user_saved_items(saved_at);

ALTER TABLE user_saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY 'Users can view their own saved items' ON user_saved_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY 'Users can insert their own saved items' ON user_saved_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY 'Users can delete their own saved items' ON user_saved_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION cleanup_old_saved_items() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN DELETE FROM user_saved_items WHERE saved_at < now() - interval '90 days'; END; $$;
