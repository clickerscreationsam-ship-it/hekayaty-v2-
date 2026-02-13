-- Atomic Registration: Automatically create a user profile in public.users when a new user signs up in Supabase Auth.

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  display_name_val TEXT;
  role_val TEXT;
BEGIN
  -- Extract metadata from the raw_user_meta_data JSONB field
  username_val := (NEW.raw_user_meta_data->>'username');
  display_name_val := (NEW.raw_user_meta_data->>'display_name');
  role_val := (NEW.raw_user_meta_data->>'role');

  -- Fallback for display_name if not provided
  IF display_name_val IS NULL THEN
    display_name_val := split_part(NEW.email, '@', 1);
  END IF;

  -- Fallback for role if not provided
  IF role_val IS NULL THEN
    role_val := 'reader';
  END IF;

  -- Insert the new user into the public.users table
  BEGIN
    INSERT INTO public.users (id, email, username, display_name, role)
    VALUES (
      NEW.id, 
      NEW.email, 
      LOWER(TRIM(username_val)), 
      TRIM(display_name_val), 
      role_val
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Registration failed: Username or Email already exists.';
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create a public profile automatically upon auth signup.';
