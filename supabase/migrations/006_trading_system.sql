-- ============================================================
-- GreenCredits — Trading System
-- ============================================================

-- System settings (trading on/off toggle)
CREATE TABLE IF NOT EXISTS system_settings (
  key   text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" ON system_settings
  FOR SELECT USING (true);

INSERT INTO system_settings (key, value) VALUES ('trading_active', 'false') ON CONFLICT (key) DO NOTHING;

-- Buy orders table
CREATE TABLE IF NOT EXISTS buy_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity         integer NOT NULL CHECK (quantity > 0),
  price_per_credit numeric(10,2) NOT NULL CHECK (price_per_credit > 0),
  filled_quantity  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'open', -- open, partial, filled, cancelled
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE buy_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view buy orders" ON buy_orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own buy orders" ON buy_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Add filled_quantity to listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS filled_quantity integer NOT NULL DEFAULT 0;

-- Add price_per_credit to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price_per_credit numeric(10,2);
