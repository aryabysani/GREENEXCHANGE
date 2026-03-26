-- ============================================================
-- Migration 011 — Add is_custom flag to emissions_data
-- ============================================================

ALTER TABLE emissions_data
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

-- All previous rows default to is_custom = false (admin-provided)
