-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table for user profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT UNIQUE NOT NULL DEFAULT 'default',
  name TEXT,
  gender TEXT,
  age INTEGER,
  calendar_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_key for fast lookups
CREATE INDEX idx_users_user_key ON users(user_key);

-- Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default user
INSERT INTO users (user_key, name, gender, age, calendar_url, photo_url)
VALUES ('default', NULL, NULL, NULL, NULL, NULL)
ON CONFLICT (user_key) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE users IS 'User profile information';
COMMENT ON COLUMN users.id IS 'User UUID (auto-generated)';
COMMENT ON COLUMN users.user_key IS 'User lookup key (default: "default" for single-user setup)';
COMMENT ON COLUMN users.name IS 'User full name';
COMMENT ON COLUMN users.gender IS 'User gender (Male/Female/Other/Prefer not to say)';
COMMENT ON COLUMN users.age IS 'User age in years';
COMMENT ON COLUMN users.calendar_url IS 'Google Calendar URL or ID';
COMMENT ON COLUMN users.photo_url IS 'Profile photo URL (from Supabase Storage)';
