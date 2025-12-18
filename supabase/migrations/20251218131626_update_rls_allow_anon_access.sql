/*
  # Update RLS Policies for Anonymous Access
  
  1. Changes
    - Drop existing authenticated-only policies on panes and news_items
    - Add new policies allowing anonymous (anon) role to read data
    - Keep RLS enabled for security but allow public read access
  
  2. Security
    - Read-only access for anonymous users
    - Write operations still require authentication
    - Data remains protected but publicly viewable
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read panes" ON panes;
DROP POLICY IF EXISTS "Authenticated users can read news" ON news_items;

-- Create new policies allowing anonymous access
CREATE POLICY "Anyone can read panes"
  ON panes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read news items"
  ON news_items FOR SELECT
  TO anon, authenticated
  USING (true);
