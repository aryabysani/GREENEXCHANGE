-- Add is_hidden flag to listings (used when a stall is banned)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
