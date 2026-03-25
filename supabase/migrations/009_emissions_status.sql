-- ============================================================
-- Migration 009 — Add status column to emissions_data
-- Run this in Supabase SQL Editor
-- Does NOT touch any trading tables
-- ============================================================

-- Step 1: Drop the GENERATED column (can't add status alongside it easily)
-- and replace it with a plain stored numeric + default trigger approach.
-- We'll just make total_emission a regular numeric column and compute
-- it in application code (already done client-side).

ALTER TABLE emissions_data
  DROP COLUMN IF EXISTS total_emission;

ALTER TABLE emissions_data
  ADD COLUMN total_emission numeric NOT NULL DEFAULT 0;

-- Step 2: Add status column
ALTER TABLE emissions_data
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved'));

-- Step 3: Back-fill total_emission for existing rows
UPDATE emissions_data
  SET total_emission = quantity * emission_per_unit
  WHERE total_emission = 0;

-- Step 4: Ensure updated_at column exists (it does, but just in case)
-- Nothing needed here.

-- Done. All existing rows now have status = 'pending'.
