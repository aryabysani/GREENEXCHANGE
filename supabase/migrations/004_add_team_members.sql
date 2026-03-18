-- Add team_members column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_members text[] NOT NULL DEFAULT '{}'::text[];
