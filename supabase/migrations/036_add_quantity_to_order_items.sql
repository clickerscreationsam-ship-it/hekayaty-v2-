-- 036_add_quantity_to_order_items.sql
-- Add quantity column to order_items table to fix multi-item order issues

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

-- Update existing records to have quantity 1 (if they don't already)
UPDATE order_items SET quantity = 1 WHERE quantity IS NULL;
