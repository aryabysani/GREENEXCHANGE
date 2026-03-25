-- ============================================================
-- Migration 010 — Add submission flag to emissions_data
-- ============================================================

ALTER TABLE emissions_data
  ADD COLUMN IF NOT EXISTS is_submitted boolean NOT NULL DEFAULT false;

-- Add optional verification flag as requested for the lightweight approval
ALTER TABLE emissions_data
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
