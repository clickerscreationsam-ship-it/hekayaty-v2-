-- Fix RLS policies on orders and order_items
-- The orders.user_id column is TEXT but auth.uid() returns UUID
-- This mismatch caused ALL order reads to silently return empty results
-- Fix: cast auth.uid() to TEXT in all order-related RLS policies

-- Fix Orders SELECT policy
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Fix Orders INSERT policy (user creates order for themselves)
DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Fix Orders UPDATE policy (admin only via service key, but allow self-update for proof upload)
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Fix Order Items SELECT policy -- buyer (via orders) or creator
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()::text
    )
    OR auth.uid()::text = creator_id
  );
