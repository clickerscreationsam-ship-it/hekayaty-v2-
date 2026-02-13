-- Run this in Supabase SQL Editor to check admin setup

-- 1. Check if you have a users table entry
SELECT id, username, email, role, is_active 
FROM users 
WHERE role = 'admin' OR email LIKE '%admin%';

-- 2. Check all orders in the system
SELECT id, user_id, status, is_verified, payment_method, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if your current auth user has a public.users entry
-- (You'll need to replace YOUR_AUTH_USER_ID with your actual Supabase auth.users ID)
-- Find your ID by running: SELECT auth.uid(); when logged in
SELECT * FROM users WHERE id = auth.uid();

-- 4. If no admin user exists, create one (replace with your auth user ID)
-- UPDATE users SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';
-- or
-- INSERT INTO users (id, username, email, role, display_name, password, is_active, commission_rate, subscription_tier)
-- VALUES ('YOUR_AUTH_USER_ID', 'admin', 'admin@example.com', 'admin', 'Admin', 'dummy', true, 0, 'free')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
