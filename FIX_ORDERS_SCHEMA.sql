-- ============================================
-- FIX ORDERS SCHEMA - Delete UUID Orders
-- ============================================
-- These UUID orders were created incorrectly and have no order_items
-- The schema expects integer IDs (serial)

-- Step 1: Verify current state
SELECT 'Current orders count:' as step, COUNT(*) as count FROM orders;
SELECT 'Current order_items count:' as step, COUNT(*) as count FROM order_items;
SELECT 'Current earnings count:' as step, COUNT(*) as count FROM earnings;

-- Step 2: Delete UUID-based orders (these are orphaned with no items)
DELETE FROM orders 
WHERE id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Verify cleanup
SELECT 'After cleanup - orders count:' as step, COUNT(*) as count FROM orders;

-- Step 4: Reset the serial sequence if needed
SELECT setval('orders_id_seq', COALESCE((SELECT MAX(id) FROM orders), 0) + 1, false);

-- Step 5: Show remaining orders (should only be integer-based ones)
SELECT * FROM orders;

-- ============================================
-- RESULT: Database is now clean and ready for proper order testing
-- Next step: Create an order through the checkout flow to test
-- ============================================
