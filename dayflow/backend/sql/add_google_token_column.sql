-- Add google_token JSONB column to users table
-- Run this in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token jsonb;
