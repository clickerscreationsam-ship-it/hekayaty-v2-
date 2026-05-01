-- Enable RLS on chapters table
ALTER TABLE IF EXISTS chapters ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view chapters of published products (or if they are the owner)
DROP POLICY IF EXISTS "Anyone can view chapters of published products" ON chapters;
CREATE POLICY "Anyone can view chapters of published products" ON chapters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = chapters.product_id 
            AND (products.is_published = true OR products.writer_id = auth.uid())
        )
    );

-- 2. Writers can manage chapters of their own products
DROP POLICY IF EXISTS "Writers can manage own chapters" ON chapters;
CREATE POLICY "Writers can manage own chapters" ON chapters
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = chapters.product_id 
            AND products.writer_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = chapters.product_id 
            AND products.writer_id = auth.uid()
        )
    );

-- 3. Admins can view and manage all chapters
DROP POLICY IF EXISTS "Admins can manage all chapters" ON chapters;
CREATE POLICY "Admins can manage all chapters" ON chapters
    FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
