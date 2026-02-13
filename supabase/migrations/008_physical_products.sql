-- 008_physical_products.sql

-- 1. Create Shipping Rates Table (Per Creator)
CREATE TABLE IF NOT EXISTS shipping_rates (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL, -- e.g., "Cairo", "Delta", "Upper Egypt", "International"
  amount INTEGER NOT NULL DEFAULT 0, -- Shipping cost in cents
  delivery_time_min INTEGER, -- e.g., 3 days
  delivery_time_max INTEGER, -- e.g., 5 days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_rates_creator ON shipping_rates(creator_id);

-- 2. Create Shipping Addresses Table (For Buyers)
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  city TEXT NOT NULL,
  address_line TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipping_addresses_user ON shipping_addresses(user_id);

-- 3. Modify Products Table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL, -- Null = unlimited/digital, 0+ = tracked stock
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT NULL, -- In grams
ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT FALSE;

-- 4. Modify Orders Table (Snapshot of Shipping Info)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT NULL, -- Snapshot of address at checkout
ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0; -- Total shipping paid

-- 5. Modify Order Items Table (Fulfillment Status per Item/Creator)
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'shipped', 'delivered', 'cancelled', 'returned')),
ADD COLUMN IF NOT EXISTS tracking_number TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 6. RLS Policies
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Shipping Rates: Public read, Creator write
CREATE POLICY "Public read shipping rates" ON shipping_rates FOR SELECT USING (true);
CREATE POLICY "Creators manage own rates" ON shipping_rates FOR ALL USING (auth.uid() = creator_id);

-- Addresses: User manage own
CREATE POLICY "Users manage own addresses" ON shipping_addresses FOR ALL USING (auth.uid() = user_id);
