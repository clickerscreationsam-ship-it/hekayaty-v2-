-- Lockdown Storage Buckets for Hekayaty
-- This migration ensures that private files (books, assets) are not publicly accessible.

-- 1. Make the product-files bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'product-files';

-- 2. Drop existing wide-open policies for product-files
DROP POLICY IF EXISTS "Product files are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a product file." ON storage.objects;

-- 3. Create SECURE Payout policies for Product Files
-- We assume files are stored in paths like 'products/{product_id}/{filename}'
-- or associated via the file_url mapping.

-- SELECT: Only allow owners, buyers, or admins
CREATE POLICY "Strict Select for Product Files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files' AND (
    -- 1. Owners/Creators can access their own files
    owner = auth.uid()
    OR
    -- 2. Admins can access everything
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR
    -- 3. Buyers can access files for products they have purchased
    -- This relies on the file being stored in a path that starts with the product_id
    -- Path format: 'product_id/filename'
    EXISTS (
        SELECT 1 
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.user_id = auth.uid()
        AND o.status = 'paid'
        AND oi.product_id::text = (storage.foldername(name))[1]
    )
    OR
    -- 4. Allow access if the product is FREE (to avoid breaking samples/free books)
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND p.price = 0
    )
  )
);

-- INSERT: Only creators/writers can upload to their own product folders
CREATE POLICY "Strict Insert for Product Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-files' AND (
    -- Admins can upload
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    OR
    -- Creators can upload if they are the writer of the product folder
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.writer_id = auth.uid()
    )
  )
);

-- DELETE: Only owners or admins
CREATE POLICY "Strict Delete for Product Files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-files' AND (
    owner = auth.uid()
    OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  )
);

-- 4. Harden Chat Attachments (If any)
-- Assuming we might add a 'chat-attachments' bucket later, we should follow similar patterns.

-- 5. Keep Avatars and Banners Public but limit UPLOAD
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Standard Avatar Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (substring(name from 1 for 36) = auth.uid()::text) -- Check if filename starts with user ID
);

DROP POLICY IF EXISTS "Anyone can upload a banner." ON storage.objects;
CREATE POLICY "Standard Banner Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-banners' AND 
  (substring(name from 1 for 36) = auth.uid()::text)
);
