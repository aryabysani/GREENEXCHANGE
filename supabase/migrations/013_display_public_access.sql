-- ============================================================
-- GreenCredits — Display Screen Public Access
-- This allows the public /display page to read market data.
-- ============================================================

-- Allow public to see open buy orders (for market transparency)
CREATE POLICY "Buy orders are publicly readable"
  ON buy_orders FOR SELECT
  USING (status = 'open' or status = 'partial');

-- Allow public to see trade history (for market transparency)
CREATE POLICY "Trades are publicly readable"
  ON transactions FOR SELECT
  USING (true);

-- Ensure listings are publicly readable (already handled in 001, but adding for completeness)
-- The original policy in 001 allows select where status='live' OR seller_id=auth.uid()
-- That should be enough if we only show 'live' ones.
