-- ============================================
-- Global Community Chat & Moderation System
-- Migration: 021
-- ============================================

-- 1. Modify chat_messages for Global Support
-- Setting store_id as nullable means the message belongs to the "Global Universe" chat
ALTER TABLE public.chat_messages ALTER COLUMN store_id DROP NOT NULL;

-- 2. User Moderation State
-- Allows admins to mute problematic users site-wide
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shadow_banned BOOLEAN DEFAULT FALSE;

-- 3. Moderation Reports Table
-- Allows community to flag inappropriate content
CREATE TABLE IF NOT EXISTS public.chat_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Secure RLS for Reports
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can report
CREATE POLICY "Users can create reports" ON public.chat_reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Only admins can see the report queue
CREATE POLICY "Admins can manage reports" ON public.chat_reports
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Hardened Chat Policies for Global & Muting
-- We must update the "Send" policy to check if a user is muted
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.chat_messages;

CREATE POLICY "Authenticated non-muted users can send messages" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = sender_id AND
        NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (is_muted = true OR shadow_banned = true)
        )
    );

-- Update Delete policy to allow Admins to moderate the Global Chat
DROP POLICY IF EXISTS "Sender or Store Owner can delete messages" ON public.chat_messages;

CREATE POLICY "Sender, Store Owner, or Admin can delete messages" ON public.chat_messages
    FOR DELETE TO authenticated USING (
        auth.uid() = sender_id OR 
        auth.uid() = store_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Chat View Policy
-- Ensure users don't see messages from shadow-banned users (unless they ARE that user)
DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON public.chat_messages;

CREATE POLICY "Secure chat viewing" ON public.chat_messages
    FOR SELECT TO authenticated USING (
        -- If sender is shadow banned, only they can see their own message
        NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = public.chat_messages.sender_id AND shadow_banned = true
        ) 
        OR auth.uid() = sender_id
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Ensure Realtime is active for reports as well
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reports;
