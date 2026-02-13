-- Story Collections and Collections-based Access System

-- 1. Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    writer_id TEXT NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    price NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'public', -- 'public', 'private'
    total_sales INTEGER DEFAULT 0,
    estimated_total_parts INTEGER,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create collection_items table
CREATE TABLE IF NOT EXISTS public.collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    story_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, story_id)
);

-- 3. Create purchases table for access control
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id),
    product_type TEXT NOT NULL, -- 'story', 'collection'
    product_id TEXT NOT NULL, -- UUID for collection, string(int) for story
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_type, product_id)
);

-- 4. Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_collections_writer_id ON public.collections(writer_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_published ON public.collections(is_published);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON public.collections(visibility);
CREATE INDEX IF NOT EXISTS idx_collections_price ON public.collections(price);
CREATE INDEX IF NOT EXISTS idx_collection_items_coll_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);

-- 6. RLS Policies for Collections
CREATE POLICY "Collections are viewable by everyone"
ON public.collections FOR SELECT
USING (
    (is_published = true AND visibility = 'public' AND deleted_at IS NULL)
    OR
    (writer_id = auth.uid())
);

CREATE POLICY "Writers can create collections"
ON public.collections FOR INSERT
TO authenticated
WITH CHECK (writer_id = auth.uid());

CREATE POLICY "Writers can update their own collections"
ON public.collections FOR UPDATE
TO authenticated
USING (writer_id = auth.uid());

CREATE POLICY "Writers can delete their own collections"
ON public.collections FOR DELETE
TO authenticated
USING (writer_id = auth.uid());

-- 7. RLS Policies for Collection Items
CREATE POLICY "Collection items are viewable by bundle viewers"
ON public.collection_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_id
        AND (c.writer_id = auth.uid() OR (c.is_published = true AND c.visibility = 'public'))
    )
);

CREATE POLICY "Writers can manage their own collection items"
ON public.collection_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.collections c
        WHERE c.id = collection_items.collection_id
        AND c.writer_id = auth.uid()
    )
);

-- 8. RLS Policies for Purchases
CREATE POLICY "Users can view their own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 9. Update Product Content RLS to support Collection Ownership
-- Drop existing policy if it exists to update it
DROP POLICY IF EXISTS "Strict View for Product Contents" ON public.product_contents;

CREATE POLICY "Strict View for Product Contents"
ON public.product_contents FOR SELECT
TO authenticated
USING (
  -- 1. Owners can see
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_contents.product_id
    AND p.writer_id = auth.uid()
  )
  OR
  -- 2. Admins can see
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  OR
  -- 3. Buyers can see (via Orders)
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = auth.uid()
    AND o.status = 'paid'
    AND oi.product_id = product_contents.product_id
  )
  OR
  -- 4. Collection Buyers can see (via Purchases)
  EXISTS (
    SELECT 1 FROM public.purchases pur
    JOIN public.collection_items ci ON pur.product_id = ci.collection_id::text
    WHERE pur.user_id = auth.uid()
    AND pur.product_type = 'collection'
    AND ci.story_id = product_contents.product_id
  )
  OR
  -- 5. Free products
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_contents.product_id
    AND p.price = 0
  )
);

-- Similar update for chapters
DROP POLICY IF EXISTS "Direct purchasers can read chapters" ON public.chapters;
CREATE POLICY "Direct purchasers can read chapters"
ON public.chapters FOR SELECT
TO authenticated
USING (
    -- Direct Purchase
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.product_id = chapters.productId
        AND o.user_id = auth.uid()
        AND o.status = 'paid'
    )
    OR
    -- Collection Purchase
    EXISTS (
        SELECT 1 FROM public.purchases pur
        JOIN public.collection_items ci ON pur.product_id = ci.collection_id::text
        WHERE pur.user_id = auth.uid()
        AND pur.product_type = 'collection'
        AND ci.story_id = chapters.productId
    )
    OR
    -- Owner
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = chapters.productId
        AND p.writer_id = auth.uid()
    )
    OR
    -- Free
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = chapters.productId
        AND p.price = 0
    )
);
