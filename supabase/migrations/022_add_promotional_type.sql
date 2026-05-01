-- 022_add_promotional_type.sql

-- This migration updates the products table constraint to allow the new "promotional" product type.
-- This type is used for showcase-only content that is not purchasable.

-- Update the products_type_check constraint to include 'promotional'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('ebook', 'asset', 'bundle', 'physical', 'promotional'));
