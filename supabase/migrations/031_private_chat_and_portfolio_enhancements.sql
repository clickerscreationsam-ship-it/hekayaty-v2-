-- Migration: 031_private_chat_and_portfolio_enhancements.sql
-- Description: Adds tables for private client-artist chats and enhances portfolio with multiple images.

-- 1. Private Chats Table
CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id),  -- Client
    artist_id TEXT NOT NULL REFERENCES public.users(id), -- Artist
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Private Chat Messages Table
CREATE TABLE IF NOT EXISTS public.private_chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.private_chats(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance Portfolios Table
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS additional_images JSONB; -- Array of image URLs

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_private_chats_user ON public.private_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_private_chats_artist ON public.private_chats(artist_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_chat ON public.private_chat_messages(chat_id);

-- 5. RLS Policies

-- Private Chats
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own chats" ON public.private_chats;
CREATE POLICY "Users can view their own chats"
ON public.private_chats FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text 
    OR artist_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Users can create chats" ON public.private_chats;
CREATE POLICY "Users can create chats"
ON public.private_chats FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()::text
);

-- Private Chat Messages
ALTER TABLE public.private_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view messages" ON public.private_chat_messages;
CREATE POLICY "Participants can view messages"
ON public.private_chat_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.private_chats 
        WHERE id = chat_id 
        AND (user_id = auth.uid()::text OR artist_id = auth.uid()::text)
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.private_chat_messages;
CREATE POLICY "Participants can send messages"
ON public.private_chat_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.private_chats 
        WHERE id = chat_id 
        AND (user_id = auth.uid()::text OR artist_id = auth.uid()::text)
    )
);

-- 6. Trigger for updated_at on chats
DROP TRIGGER IF EXISTS update_private_chats_modtime ON public.private_chats;
CREATE TRIGGER update_private_chats_modtime
BEFORE UPDATE ON public.private_chats
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
