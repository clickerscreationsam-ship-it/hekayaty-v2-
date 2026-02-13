-- Add collection_id to order_items to support story collections
ALTER TABLE public.order_items ADD COLUMN collection_id UUID REFERENCES public.collections(id);

-- Make product_id nullable since an item can be a collection instead
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

-- Log the change
COMMENT ON COLUMN public.order_items.collection_id IS 'Reference to the story collection if this item is a collection';
