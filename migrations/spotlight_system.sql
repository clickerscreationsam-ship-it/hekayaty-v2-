-- Hekayaty Spotlight Migration
-- This table stores books that have been manually selected by admins to be featured
-- in the premium Hekayaty Spotlight section.

CREATE TABLE IF NOT EXISTS spotlight_items (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    badge TEXT NOT NULL DEFAULT 'Editor''s Pick',
    editorial_note TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for quickly fetching active spotlight items ordered by their index
CREATE INDEX IF NOT EXISTS spotlight_items_active_idx ON spotlight_items (is_active, order_index);

-- Index for quickly looking up if a specific product is in the spotlight (for product pages)
CREATE INDEX IF NOT EXISTS spotlight_items_product_id_idx ON spotlight_items (product_id);
