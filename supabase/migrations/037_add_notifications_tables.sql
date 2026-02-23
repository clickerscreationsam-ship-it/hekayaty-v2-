-- ============================================
-- Notifications & User Settings System
-- Migration: 037_add_notifications_tables.sql
-- ============================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- commerce, content, social, creator, engagement, store
    priority TEXT NOT NULL DEFAULT 'low', -- low, medium, high
    link TEXT, -- Deep link URL
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Notification Settings Table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '{
        "commerce": true,
        "content": true,
        "social": true,
        "creator": true,
        "engagement": true,
        "store": true
    }'::JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- 4. RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Notification Settings Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.notification_settings;
CREATE POLICY "Users can view their own settings" 
ON public.notification_settings FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own settings" ON public.notification_settings;
CREATE POLICY "Users can update their own settings" 
ON public.notification_settings FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- 5. Automatically create settings on user creation (Optional but recommended)
-- For now, the application logic handles the creation if not exists.

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_notification_settings_modtime ON public.notification_settings;
CREATE TRIGGER update_notification_settings_modtime
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
