-- ============================================================
-- Migration 012 — Add unique constraint for CSV overwrite
-- ============================================================

-- First, deduplicate existing data if it exists (keeping the latest updated_at)
DELETE FROM emissions_data a
USING emissions_data b
WHERE a.id < b.id
  AND a.stall_no = b.stall_no
  AND a.product = b.product;

-- Now add unique constraint for stall_no + product
ALTER TABLE emissions_data
  ADD CONSTRAINT unique_stall_product UNIQUE (stall_no, product);
