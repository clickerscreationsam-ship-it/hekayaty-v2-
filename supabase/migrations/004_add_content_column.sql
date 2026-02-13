-- Add content column for storing extracted text
ALTER TABLE products ADD COLUMN IF NOT EXISTS content TEXT;

-- Update type check constraint to include 'physical'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('ebook', 'asset', 'bundle', 'physical'));
