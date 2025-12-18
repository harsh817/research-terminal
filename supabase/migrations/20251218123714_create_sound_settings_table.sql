/*
  # Create Sound Settings Table

  1. New Tables
    - `sound_settings`
      - `user_id` (uuid, primary key, references users.id)
      - `enabled` (boolean, global ON/OFF toggle)
      - `volume` (numeric, volume level 0-1)
      - `sound_tags` (theme_t[], themes that trigger sound alerts)
      - `updated_at` (timestamptz, last update timestamp)
  
  2. Security
    - Enable RLS on `sound_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to update their own settings
    - Add policy for users to insert their own settings
  
  3. Default Values
    - enabled: true
    - volume: 0.7
    - sound_tags: ['MONETARY_POLICY', 'GEOPOLITICS', 'RISK_EVENT']
  
  4. Notes
    - Each user has one row in this table
    - Settings are created on first login
    - Only theme-based sounds allowed in MVP
*/

CREATE TABLE IF NOT EXISTS sound_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT true NOT NULL,
  volume numeric CHECK (volume >= 0 AND volume <= 1) DEFAULT 0.7 NOT NULL,
  sound_tags theme_t[] DEFAULT ARRAY['MONETARY_POLICY', 'GEOPOLITICS', 'RISK_EVENT']::theme_t[] NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE sound_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY "Users can read own sound settings"
  ON sound_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own sound settings"
  ON sound_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own sound settings"
  ON sound_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sound_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_sound_settings_timestamp ON sound_settings;
CREATE TRIGGER update_sound_settings_timestamp
  BEFORE UPDATE ON sound_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_sound_settings_updated_at();