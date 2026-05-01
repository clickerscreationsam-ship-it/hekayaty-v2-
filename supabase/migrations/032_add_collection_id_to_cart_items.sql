-- Migration: 032_add_collection_id_to_cart_items.sql
-- Description: Adds collection_id to cart_items table to support story collections in cart.

-- 1. Add collection_id as UUID to match collections.id
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;

-- 2. Allow items to be added without a product_id (needed for collections)
ALTER TABLE public.cart_items ALTER COLUMN product_id DROP NOT NULL;

-- 3. Add an index to keep it fast
CREATE INDEX IF NOT EXISTS idx_cart_items_collection_id ON public.cart_items(collection_id);

-- If there are FK requirements, although collection_id is TEXT here matching the schema.ts
-- but the collections.id is UUID. We should probably keep it TEXT in cart_items if we want 
-- flexibility or cast it. In shared/schema.ts it is defined as text("collection_id").
