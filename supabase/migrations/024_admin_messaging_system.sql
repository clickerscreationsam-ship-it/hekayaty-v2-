-- Admin Private Messages Table
CREATE TABLE IF NOT EXISTS admin_private_messages (
    id SERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Global Announcements Table (Writers Only)
CREATE TABLE IF NOT EXISTS admin_writer_announcements (
    id SERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_writer_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_private_messages
-- 1. Admin can see everything or send
CREATE POLICY admin_full_access_private ON admin_private_messages
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. Recipient can read their own messages
CREATE POLICY user_read_private ON admin_private_messages
    FOR SELECT
    USING (auth.uid() = receiver_id);

-- 3. Recipient can update is_read status
CREATE POLICY user_update_read_status ON admin_private_messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- RLS Policies for admin_writer_announcements
-- 1. Admin can manage announcements
CREATE POLICY admin_manage_announcements ON admin_writer_announcements
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 2. Only Writers (Role='writer' or 'artist') can read announcements
CREATE POLICY writers_read_announcements ON admin_writer_announcements
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'writer' OR role = 'artist')));
