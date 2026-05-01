-- Add sales_count to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Optional: Index for faster sorting
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
