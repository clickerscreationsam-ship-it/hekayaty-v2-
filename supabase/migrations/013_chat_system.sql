-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages

-- 1. Everyone can view chat messages
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
    FOR SELECT TO public USING (true);

-- 2. Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- 3. Only the sender or the store owner can delete messages
CREATE POLICY "Sender or Store Owner can delete messages" ON public.chat_messages
    FOR DELETE TO authenticated USING (
        auth.uid() = sender_id OR auth.uid() = store_id
    );

-- 4. Only the store owner can update messages (for pinning)
CREATE POLICY "Store Owner can pin messages" ON public.chat_messages
    FOR UPDATE TO authenticated USING (
        auth.uid() = store_id
    ) WITH CHECK (
        auth.uid() = store_id
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
