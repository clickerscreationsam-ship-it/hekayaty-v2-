-- Migration: 034_add_product_gallery.sql
-- Description: Adds a column to store multiple product images (gallery).

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]'::jsonb;
