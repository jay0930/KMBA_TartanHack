# Database Migrations

## Running Migrations in Supabase

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard

### 2. Select Your Project
Navigate to your project: `ilprpsecghmhmquvtron`

### 3. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 4. Copy and Execute Migration
- Open `001_create_users_table.sql`
- Copy the entire content
- Paste into the SQL Editor
- Click "Run" button

### 5. Verify Table Creation
- Go to "Table Editor" in the left sidebar
- You should see a new `users` table with the following columns:
  - `id` (text, primary key)
  - `name` (text, nullable)
  - `gender` (text, nullable)
  - `age` (integer, nullable)
  - `calendar_url` (text, nullable)
  - `photo_url` (text, nullable)
  - `created_at` (timestamp with time zone)
  - `updated_at` (timestamp with time zone)

## What This Migration Does

1. Creates a `users` table for storing user profile information
2. Sets up `id` as the primary key (defaults to "default" for single-user setup)
3. Adds columns for name, gender, age, calendar_url, and photo_url
4. Creates automatic timestamps (created_at, updated_at)
5. Adds a trigger to automatically update `updated_at` on record changes

## Notes

- The default user ID is `"default"` which works for a single-user application
- If you need multi-user support in the future, you can integrate with Supabase Auth and use actual user IDs
- Gender field accepts: "Male", "Female", "Other", "Prefer not to say"
- Age is stored as an integer (years)
- Calendar URL stores the Google Calendar URL or ID
- Photo URL will eventually store the Supabase Storage URL for profile photos
