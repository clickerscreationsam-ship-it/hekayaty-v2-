-- Upgrade Hekayaty to a Creative Network & Freelance Hub
-- Migration: 030_freelance_hub_system.sql

-- 1. Update users table with skills if not exists (drizzle will handle schema.ts, but we reflect here)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS skills TEXT;

-- 2. Design Requests Table (Commission System) - Move up to satisfy FK dependencies
CREATE TABLE IF NOT EXISTS public.design_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES public.users(id),
    artist_id TEXT NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget INTEGER NOT NULL, -- In EGP
    deadline TIMESTAMP WITH TIME ZONE,
    license_type TEXT DEFAULT 'personal', -- 'personal', 'commercial'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'in_progress', 'delivered', 'completed', 'cancelled'
    escrow_locked BOOLEAN DEFAULT false,
    reference_images JSONB,
    final_file_url TEXT,
    payment_proof_url TEXT,
    payment_reference TEXT,
    payment_verified_by TEXT REFERENCES public.users(id),
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns just in case table already exists
ALTER TABLE public.design_requests ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE public.design_requests ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE public.design_requests ADD COLUMN IF NOT EXISTS payment_verified_by TEXT REFERENCES public.users(id);
ALTER TABLE public.design_requests ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_requests ALTER COLUMN status SET DEFAULT 'inquiry';

-- 3. Portfolios Table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id TEXT NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Cover', 'Character', 'Map', 'UI', 'Branding', 'Other'
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT,
    order_index INTEGER DEFAULT 0,
    year_created TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Modify earnings to support optional orderId and new designRequestId
ALTER TABLE public.earnings ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE public.earnings ADD COLUMN IF NOT EXISTS design_request_id UUID REFERENCES public.design_requests(id);


-- 4. Design Messages Table (Thread within request)
CREATE TABLE IF NOT EXISTS public.design_messages (
    id SERIAL PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.design_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.users(id),
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_portfolios_artist_id ON public.portfolios(artist_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON public.portfolios(category);
CREATE INDEX IF NOT EXISTS idx_design_requests_artist_id ON public.design_requests(artist_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_client_id ON public.design_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_status ON public.design_requests(status);
CREATE INDEX IF NOT EXISTS idx_design_messages_request_id ON public.design_messages(request_id);

-- 6. RLS Policies

-- Portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active portfolio items are public" ON public.portfolios;
CREATE POLICY "Active portfolio items are public"
ON public.portfolios FOR SELECT
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Artists can manage their own portfolio" ON public.portfolios;
CREATE POLICY "Artists can manage their own portfolio"
ON public.portfolios FOR ALL
TO authenticated
USING (artist_id = auth.uid()::text);

-- Design Requests
ALTER TABLE public.design_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants and admins can view requests" ON public.design_requests;
CREATE POLICY "Participants and admins can view requests"
ON public.design_requests FOR SELECT
TO authenticated
USING (
    client_id = auth.uid()::text 
    OR artist_id = auth.uid()::text 
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Clients can create design requests" ON public.design_requests;
CREATE POLICY "Clients can create design requests"
ON public.design_requests FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid()::text);

DROP POLICY IF EXISTS "Participants can update requests" ON public.design_requests;
CREATE POLICY "Participants can update requests"
ON public.design_requests FOR UPDATE
TO authenticated
USING (
    client_id = auth.uid()::text 
    OR artist_id = auth.uid()::text
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
);

-- Design Messages
ALTER TABLE public.design_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view request messages" ON public.design_messages;
CREATE POLICY "Participants can view request messages"
ON public.design_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.design_requests 
        WHERE id = request_id 
        AND (client_id = auth.uid()::text OR artist_id = auth.uid()::text)
    )
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
);

DROP POLICY IF EXISTS "Participants can send messages" ON public.design_messages;
CREATE POLICY "Participants can send messages"
ON public.design_messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid()::text
    AND (
        EXISTS (
            SELECT 1 FROM public.design_requests 
            WHERE id = request_id 
            AND (client_id = auth.uid()::text OR artist_id = auth.uid()::text)
            AND status NOT IN ('completed', 'cancelled', 'rejected')
        )
        OR (SELECT role FROM public.users WHERE id = auth.uid()::text) = 'admin'
    )
);

-- 7. Functions & Triggers

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_portfolios_modtime ON public.portfolios;
CREATE TRIGGER update_portfolios_modtime
BEFORE UPDATE ON public.portfolios
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_design_requests_modtime ON public.design_requests;
CREATE TRIGGER update_design_requests_modtime
BEFORE UPDATE ON public.design_requests
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
