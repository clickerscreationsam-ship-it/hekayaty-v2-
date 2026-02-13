-- Migration: 032_add_collection_id_to_cart_items.sql
-- Description: Adds collection_id to cart_items table to support story collections in cart.

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS collection_id TEXT;
ALTER TABLE public.cart_items ALTER COLUMN product_id DROP NOT NULL;

-- Update RLS or indexes if needed
CREATE INDEX IF NOT EXISTS idx_cart_items_collection_id ON public.cart_items(collection_id);

-- If there are FK requirements, although collection_id is TEXT here matching the schema.ts
-- but the collections.id is UUID. We should probably keep it TEXT in cart_items if we want 
-- flexibility or cast it. In shared/schema.ts it is defined as text("collection_id").
