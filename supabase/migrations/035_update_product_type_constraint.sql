-- Migration: 035_update_product_type_constraint.sql
-- Description: Updates the 'products_type_check' constraint to include the new 'merchandise' type.

-- 1. Drop the old constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_type_check;

-- 2. Add the updated constraint including 'merchandise'
ALTER TABLE public.products ADD CONSTRAINT products_type_check CHECK (type IN ('ebook', 'asset', 'bundle', 'physical', 'promotional', 'merchandise'));
