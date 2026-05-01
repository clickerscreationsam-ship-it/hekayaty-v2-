-- Check existing pending orders
SELECT count(*) as pending_orders_count FROM orders WHERE status = 'pending';

-- If you want to TEST if the dashboard works, run this to insert a dummy order:
-- (Uncomment the lines below to run)

-- INSERT INTO orders (user_id, total_amount, status, is_verified, payment_method, payment_proof_url)
-- VALUES 
--   ('dd9d2726-d4c8-470d-9c9d-da4c8100a997', 50.00, 'pending', false, 'instapay', 'http://example.com/proof.jpg');

-- SELECT * FROM orders WHERE status = 'pending';
