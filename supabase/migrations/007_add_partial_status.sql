-- Add 'partial' to listing_status enum (partially-filled sell orders)
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'partial';
