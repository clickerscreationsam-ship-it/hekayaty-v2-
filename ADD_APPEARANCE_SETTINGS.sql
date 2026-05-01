-- Add appearance_settings column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS appearance_settings JSONB DEFAULT '{}'::jsonb;

-- Notify PostgREST to reload the schema cache
-- You might need to run this or simply wait a few minutes for Supabase to auto-refresh
NOTIFY pgrst, 'reload schema';
