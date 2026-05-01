-- Populate Database with Test Sales Data
-- This will add realistic sales data to show earnings correctly

-- Step 1: Get the current user's ID (replace with your actual user ID)
-- You can find this by looking at the auth.users table or from your dashboard

-- Step 2: Update existing products to have sales count
UPDATE products
SET sales_count = 8
WHERE writer_id IN (
    SELECT id FROM users 
    WHERE role IN ('writer', 'artist')
    LIMIT 1
)
AND is_published = true;

-- Step 3: Create sample order and order items if needed
DO $$
DECLARE
    v_user_id TEXT;
    v_creator_id TEXT;
    v_product_id INT;
    v_product_price INT;
    v_order_id INT;
    v_commission_rate INT;
    v_earning_amount INT;
BEGIN
    -- Get first creator
    SELECT id INTO v_creator_id 
    FROM users 
    WHERE role IN ('writer', 'artist') 
    LIMIT 1;
    
    -- Get first published product from this creator
    SELECT id, price INTO v_product_id, v_product_price
    FROM products 
    WHERE writer_id = v_creator_id 
    AND is_published = true
    LIMIT 1;
    
    -- Get commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM users
    WHERE id = v_creator_id;
    
    IF v_commission_rate IS NULL THEN
        v_commission_rate := 20;
    END IF;
    
    -- Calculate earning (80% if commission is 20%)
    v_earning_amount := ROUND(v_product_price * (100 - v_commission_rate) / 100.0);
    
    IF v_product_id IS NOT NULL THEN
        -- Create a paid order
        INSERT INTO orders (
            user_id,
            total_amount,
            platform_fee,
            creator_earnings,
            status,
            payment_method,
            is_verified
        ) VALUES (
            v_creator_id, -- buyer is same as creator for demo
            v_product_price,
            ROUND(v_product_price * v_commission_rate / 100.0),
            v_earning_amount,
            'paid',
            'card',
            true
        ) RETURNING id INTO v_order_id;
        
        -- Create order item
        INSERT INTO order_items (
            order_id,
            product_id,
            price,
            creator_id,
            license_type
        ) VALUES (
            v_order_id,
            v_product_id,
            v_product_price,
            v_creator_id,
            'personal'
        );
        
        -- Create earning record
        INSERT INTO earnings (
            creator_id,
            order_id,
            amount,
            status
        ) VALUES (
            v_creator_id,
            v_order_id,
            v_earning_amount,
            'pending'
        );
        
        RAISE NOTICE 'Created test order % with earnings %', v_order_id, v_earning_amount;
    END IF;
END $$;

-- Verify the data was created
SELECT 
    'Products with sales' as type,
    COUNT(*) as count,
    SUM(sales_count) as total_sales,
    SUM(price * sales_count) as total_revenue
FROM products
WHERE sales_count > 0
UNION ALL
SELECT 
    'Paid orders' as type,
    COUNT(*) as count,
    0 as total_sales,
    SUM(total_amount) as total_revenue
FROM orders
WHERE status = 'paid'
UNION ALL
SELECT 
    'Earnings records' as type,
    COUNT(*) as count,
    0 as total_sales,
    SUM(amount) as total_revenue
FROM earnings;
