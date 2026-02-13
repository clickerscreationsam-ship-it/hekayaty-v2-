-- Add series support to products table
ALTER TABLE IF EXISTS products 
ADD COLUMN IF NOT EXISTS is_serialized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS series_status TEXT DEFAULT 'ongoing', -- ongoing, completed
ADD COLUMN IF NOT EXISTS last_chapter_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to update last_chapter_updated_at when a chapter is added/updated
CREATE OR REPLACE FUNCTION update_product_last_chapter_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET last_chapter_updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on chapters table
DROP TRIGGER IF EXISTS tr_update_last_chapter_timestamp ON chapters;
CREATE TRIGGER tr_update_last_chapter_timestamp
AFTER INSERT OR UPDATE ON chapters
FOR EACH ROW
EXECUTE FUNCTION update_product_last_chapter_timestamp();
