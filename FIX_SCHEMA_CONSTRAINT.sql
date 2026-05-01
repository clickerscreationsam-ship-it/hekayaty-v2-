-- ============================================
-- FIX: Update fulfillment status constraint
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop the old strict constraint (if it exists under the default name)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_fulfillment_status_check;

-- 2. Add the expanded constraint that supports our Maker workflow
ALTER TABLE order_items 
ADD CONSTRAINT order_items_fulfillment_status_check 
CHECK (fulfillment_status IN ('pending', 'accepted', 'preparing', 'shipped', 'delivered', 'rejected', 'cancelled', 'returned'));

-- 3. Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'order_items_fulfillment_status_check';
