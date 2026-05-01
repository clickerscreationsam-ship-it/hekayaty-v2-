-- ============================================
-- Communication & Notifications Security Audit
-- Migration: 018 (REVISED)
-- ============================================

-- 0. Drop existing policies first to allow column type changes
-- PostgreSQL prevents altering column types if they are referenced in an active RLS policy.
DROP POLICY IF EXISTS "Users view their notifications" ON order_notifications;
DROP POLICY IF EXISTS "Users update their notifications" ON order_notifications;
DROP POLICY IF EXISTS "Makers view their order status history" ON order_status_history;
DROP POLICY IF EXISTS "Users view their order status history" ON order_status_history;

-- 1. Fix inconsistent data types and add Foreign Keys for Order Notifications
-- Now we can safely change the type to UUID
ALTER TABLE order_notifications 
ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

ALTER TABLE order_notifications
ADD CONSTRAINT order_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. Fix inconsistent data types and add Foreign Keys for Order Status History
ALTER TABLE order_status_history 
ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

ALTER TABLE order_status_history
ADD CONSTRAINT order_status_history_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. Re-create hardened RLS for Order Notifications
-- Create secure UUID-based policies
CREATE POLICY "Users view their notifications" ON order_notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update their notifications" ON order_notifications
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Re-create hardened RLS for Order Status History
CREATE POLICY "Makers view their order status history" ON order_status_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items
        WHERE order_items.id = order_status_history.order_item_id
        AND order_items.creator_id = auth.uid()
    )
);

CREATE POLICY "Users view their order status history" ON order_status_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE order_items.id = order_status_history.order_item_id
        AND orders.user_id = auth.uid()
    )
);

-- 5. Chat System Hardening
-- While it's a "Store Chat" (public), we should ensure users can only modify their own messages
-- and the store owner has proper control.
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;

-- Only authenticated users should see or send messages to prevent anonymous scraping/spam
CREATE POLICY "Authenticated users can view chat messages" ON public.chat_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Ensure Realtime is optimized for specific store IDs
COMMENT ON TABLE chat_messages IS 'Secure community chat for reader-writer interaction';
