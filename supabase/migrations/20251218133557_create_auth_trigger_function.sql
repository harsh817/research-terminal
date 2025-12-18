/*
  # Create Auth Trigger Function

  1. New Functions
    - `handle_new_user()` - Auto-creates user profile on auth signup
    - Trigger `on_auth_user_created` - Executes function after new auth user

  2. How It Works
    - When a new user signs up in auth.users, this trigger fires
    - Automatically inserts a row in public.users table
    - Prevents manual user table management
    - Ensures every auth user has a profile entry

  3. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only executes on auth.users INSERT
    - No user input validation needed (controlled by auth system)
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to execute function after new auth user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();