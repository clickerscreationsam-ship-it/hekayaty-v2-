-- Enable Row Level Security on all tables
ALTER TABLE IF EXISTS cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Cart Items Policies
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders Policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Order Items Policies (Sellers need to see their items)
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT 
  USING (
    -- Either the buyer or the creator can view
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
    OR creator_id = auth.uid()
  );

-- Earnings Policies
DROP POLICY IF EXISTS "Creators can view own earnings" ON earnings;
CREATE POLICY "Creators can view own earnings" ON earnings
  FOR SELECT 
  USING (auth.uid() = creator_id);

-- Payouts Policies
DROP POLICY IF EXISTS "Creators can view own payouts" ON payouts;
CREATE POLICY "Creators can view own payouts" ON payouts
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Products Policies
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
CREATE POLICY "Anyone can view published products" ON products
  FOR SELECT 
  USING (is_published = true OR writer_id = auth.uid());

DROP POLICY IF EXISTS "Writers can manage own products" ON products;
CREATE POLICY "Writers can manage own products" ON products
  FOR ALL 
  USING (auth.uid() = writer_id)
  WITH CHECK (auth.uid() = writer_id);

-- Users Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Follows Policies
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;
CREATE POLICY "Users can manage own follows" ON follows
  FOR ALL 
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows" ON follows
  FOR SELECT 
  USING (true);

-- Saved Library Policies
DROP POLICY IF EXISTS "Users can manage own library" ON saved_library;
CREATE POLICY "Users can manage own library" ON saved_library
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shipping Rates Policies
DROP POLICY IF EXISTS "Creators can manage own shipping rates" ON shipping_rates;
CREATE POLICY "Creators can manage own shipping rates" ON shipping_rates
  FOR ALL 
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can view shipping rates" ON shipping_rates;
CREATE POLICY "Anyone can view shipping rates" ON shipping_rates
  FOR SELECT 
  USING (true);

-- Shipping Addresses Policies
DROP POLICY IF EXISTS "Users can manage own addresses" ON shipping_addresses;
CREATE POLICY "Users can manage own addresses" ON shipping_addresses
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can manage own cart" ON cart_items IS 'Users can only access their own cart items';
COMMENT ON POLICY "Users can view own orders" ON orders IS 'Users can only view their own orders';
COMMENT ON POLICY "Users can view own order items" ON order_items IS 'Buyers and sellers can view relevant order items';
COMMENT ON POLICY "Creators can view own earnings" ON earnings IS 'Creators can only view their own earnings';
COMMENT ON POLICY "Creators can view own payouts" ON payouts IS 'Creators can only view their own payouts';
