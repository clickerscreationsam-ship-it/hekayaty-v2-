-- Fix User ID Mismatch Issue
-- This ensures all your test data is associated with YOUR actual user account

-- Step 1: Show your current user ID
SELECT 
    id as your_user_id,
    email,
    role,
    display_name
FROM users
WHERE role IN ('writer', 'artist', 'admin')
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check what user IDs are in the products/earnings
SELECT DISTINCT
    'Products' as table_name,
    writer_id as user_id,
    COUNT(*) as count
FROM products
GROUP BY writer_id
UNION ALL
SELECT 
    'Order Items' as table_name,
    creator_id as user_id,
    COUNT(*) as count
FROM order_items
GROUP BY creator_id
UNION ALL
SELECT 
    'Earnings' as table_name,
    creator_id as user_id,
    COUNT(*) as count
FROM earnings
GROUP BY creator_id;

-- Step 3: Update all data to YOUR user ID
-- IMPORTANT: First run Step 1 to get YOUR user ID, then replace 'YOUR_USER_ID_HERE' below

-- Example (uncomment and replace with your actual ID):
-- DO $$
-- DECLARE
--     v_your_user_id TEXT := 'YOUR_USER_ID_HERE'; -- Replace with your actual user ID from Step 1
--     v_old_user_id TEXT;
-- BEGIN
--     -- Find the first creator ID in products
--     SELECT writer_id INTO v_old_user_id 
--     FROM products 
--     WHERE is_published = true 
--     LIMIT 1;
--     
--     IF v_old_user_id IS NOT NULL AND v_old_user_id != v_your_user_id THEN
--         -- Update products
--         UPDATE products SET writer_id = v_your_user_id WHERE writer_id = v_old_user_id;
--         
--         -- Update order_items
--         UPDATE order_items SET creator_id = v_your_user_id WHERE creator_id = v_old_user_id;
--         
--         -- Update earnings
--         UPDATE earnings SET creator_id = v_your_user_id WHERE creator_id = v_old_user_id;
--         
--         RAISE NOTICE 'Updated records from % to %', v_old_user_id, v_your_user_id;
--     END IF;
-- END $$;
