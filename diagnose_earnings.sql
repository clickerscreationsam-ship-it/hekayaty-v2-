-- Quick diagnostic: Check current database state
-- Run this to see what data exists

-- Check products
SELECT 
    id,
    title,
    price,
    sales_count,
    writer_id
FROM products
ORDER BY id DESC
LIMIT 5;

-- Check orders
SELECT 
    id,
    user_id,
    total_amount,
    status,
    created_at
FROM orders
ORDER BY id DESC
LIMIT 5;

-- Check order_items
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    oi.price,
    oi.creator_id,
    o.status as order_status
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
ORDER BY oi.id DESC
LIMIT 5;

-- Check earnings
SELECT 
    id,
    creator_id,
    order_id,
    amount,
    status
FROM earnings
ORDER BY id DESC
LIMIT 5;

-- Summary stats
SELECT 
    (SELECT COUNT(*) FROM products WHERE is_published = true) as published_products,
    (SELECT COUNT(*) FROM orders WHERE status = 'paid') as paid_orders,
    (SELECT COUNT(*) FROM order_items) as total_order_items,
    (SELECT COUNT(*) FROM earnings) as total_earnings,
    (SELECT SUM(sales_count) FROM products) as total_sales_count;
