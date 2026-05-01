-- Create media_category type if not exists
DO $$ BEGIN
    CREATE TYPE media_category AS ENUM ('trailer', 'song', 'announcement', 'universe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create media_videos table for the new Hekayaty Media Hub
CREATE TABLE IF NOT EXISTS media_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    youtube_url TEXT NOT NULL,
    youtube_video_id TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    category media_category NOT NULL,
    related_story_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by YouTube ID
CREATE INDEX IF NOT EXISTS idx_media_videos_youtube_id ON media_videos(youtube_video_id);

-- Enable Row Level Security
ALTER TABLE media_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Public read access" ON media_videos;
DROP POLICY IF EXISTS "Admin manage access" ON media_videos;

-- Anyone can view videos
CREATE POLICY "Public read access" ON media_videos
    FOR SELECT USING (true);

-- Only admins can create/update/delete videos
CREATE POLICY "Admin manage access" ON media_videos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_media_videos_updated_at ON media_videos;
CREATE TRIGGER update_media_videos_updated_at
    BEFORE UPDATE ON media_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
