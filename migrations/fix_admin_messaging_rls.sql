-- Fix RLS Policies for admin_private_messages to allow writers to send messages to admin

-- 1. Allow users (writers) to INSERT messages where they are the sender
CREATE POLICY "user_insert_private" ON admin_private_messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 2. Allow users (writers) to SELECT (read) messages they have sent
CREATE POLICY "user_read_sent_private" ON admin_private_messages
    FOR SELECT
    USING (auth.uid() = sender_id);
