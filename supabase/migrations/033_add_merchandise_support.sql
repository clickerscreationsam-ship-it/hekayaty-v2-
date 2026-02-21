-- Migration: 033_add_merchandise_support.sql
-- Description: Adds columns to support merchandise products and custom buyer input.

-- 1. Progress products with merchandise categorization and custom fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS merchandise_category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- 2. Allow storage of customization choices in cart and orders
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS customization_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS customization_data JSONB DEFAULT '{}'::jsonb;

-- 3. Add index for performance on merchandise filtering (optional but good)
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
