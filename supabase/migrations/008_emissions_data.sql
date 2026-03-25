-- ============================================================
-- GreenCredits — Emissions Tracking Table
-- Run this in Supabase SQL Editor
-- Does NOT touch any existing tables or trading logic
-- ============================================================

CREATE TABLE IF NOT EXISTS emissions_data (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_no          text        NOT NULL,
  product           text        NOT NULL,
  quantity          numeric     NOT NULL DEFAULT 0,
  emission_per_unit numeric     NOT NULL DEFAULT 0,
  total_emission    numeric     GENERATED ALWAYS AS (quantity * emission_per_unit) STORED,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Index for fast stall-level grouping
CREATE INDEX IF NOT EXISTS emissions_data_stall_idx ON emissions_data (stall_no);

-- RLS: allow fully public read+write (no auth required for team page)
ALTER TABLE emissions_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read emissions"
  ON emissions_data FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert emissions"
  ON emissions_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update emissions"
  ON emissions_data FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete emissions"
  ON emissions_data FOR DELETE
  USING (true);
