-- Protect Ebook Content from Scraping
-- This migration moves the book text content to a separate table with stricter RLS.

-- 1. Create the product_contents table
CREATE TABLE IF NOT EXISTS public.product_contents (
    product_id INTEGER PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrate existing data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'content') THEN
        INSERT INTO public.product_contents (product_id, content)
        SELECT id, content FROM public.products
        WHERE content IS NOT NULL
        ON CONFLICT (product_id) DO UPDATE SET content = EXCLUDED.content;
    END IF;
END $$;

-- 3. Enable RLS on product_contents
ALTER TABLE public.product_contents ENABLE ROW LEVEL SECURITY;

-- 4. Create Strict RLS Policies for product_contents
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
  -- 3. Buyers can see
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = auth.uid()
    AND o.status = 'paid'
    AND oi.product_id = product_contents.product_id
  )
  OR
  -- 4. Free products
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_contents.product_id
    AND p.price = 0
  )
);

CREATE POLICY "Owners can update contents"
ON public.product_contents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
    AND p.writer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
    AND p.writer_id = auth.uid()
  )
);

-- Note: We DON'T drop the column from products yet to avoid immediate frontend breakage.
-- Instead, we will clear it after we update the frontend to use the new table.
-- UPDATE public.products SET content = NULL;
