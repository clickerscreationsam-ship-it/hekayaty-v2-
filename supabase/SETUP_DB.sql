-- ==============================================================================
-- HEKAYATY STORE - DATABASE SETUP SCRIPT
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/stbwxgnjzmmnjgdrkwmf
-- 2. Click on "SQL Editor" in the left sidebar.
-- 3. Click "New Query".
-- 4. Copy and Paste ALL the content below into the query editor.
-- 5. Click "Run" (bottom right).
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'writer', 'artist', 'admin')),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  store_settings JSONB DEFAULT '{}'::JSONB,
  stripe_account_id TEXT,
  subscription_tier text DEFAULT 'free',
  commission_rate integer DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- 2. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  writer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  file_url TEXT,
  type TEXT NOT NULL DEFAULT 'ebook' CHECK (type IN ('ebook', 'asset', 'bundle', 'physical')),
  genre TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  rating INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  sale_price INTEGER,
  sale_ends_at TIMESTAMP WITH TIME ZONE,
  license_type TEXT DEFAULT 'personal' CHECK (license_type IN ('personal', 'commercial', 'standard', 'extended')),
  content TEXT, -- Extracted text content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_writer_id ON products(writer_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_genre ON products(genre);
CREATE INDEX idx_products_published ON products(is_published);

-- =============================================
-- 3. PRODUCT VARIANTS
-- =============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'digital' CHECK (type IN ('digital', 'physical')),
  price INTEGER NOT NULL,
  license_type TEXT DEFAULT 'standard',
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);

-- =============================================
-- 4. CART ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cart_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_product_id ON cart_items(product_id);

-- =============================================
-- 5. ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  creator_earnings INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'pending_payment', 'pending_verification', 'rejected', 'completed')),
  payment_intent_id TEXT,
  payment_method TEXT DEFAULT 'card',
  payment_proof_url TEXT,
  payment_reference TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- =============================================
-- 6. ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  price INTEGER NOT NULL,
  license_type TEXT,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_creator_id ON order_items(creator_id);

-- =============================================
-- 7. REVIEWS (Optional)
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- =============================================
-- 8. PAYOUTS
-- =============================================
CREATE TABLE IF NOT EXISTS payouts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- in cents
  status text DEFAULT 'pending',
  method text DEFAULT 'stripe',
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at timestamp with time zone
);

-- =============================================
-- 9. EARNINGS
-- =============================================
CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_earnings_creator ON earnings(creator_id);
CREATE INDEX idx_earnings_status ON earnings(status);

-- =============================================
-- FUNCTIONS (Updated At)
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Enable insert for authenticated users during registration" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS
CREATE POLICY "Published products are viewable by everyone" ON products FOR SELECT USING (is_published = true OR writer_id = auth.uid());
CREATE POLICY "Users can create own products" ON products FOR INSERT WITH CHECK (auth.uid() = writer_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = writer_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = writer_id);

-- CART
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to own cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete from own cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- PAYOUTS
CREATE POLICY "Users can view their own payouts" ON payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payout requests" ON payouts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-banners', 'store-banners', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-files', 'product-files', true) on conflict (id) do nothing;

-- Storage Policies
create policy "Avatar images public" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Avatar upload" on storage.objects for insert with check ( bucket_id = 'avatars' );
create policy "Avatar update" on storage.objects for update using ( bucket_id = 'avatars' );

create policy "Banner images public" on storage.objects for select using ( bucket_id = 'store-banners' );
create policy "Banner upload" on storage.objects for insert with check ( bucket_id = 'store-banners' );
create policy "Banner update" on storage.objects for update using ( bucket_id = 'store-banners' );

create policy "Product files public" on storage.objects for select using ( bucket_id = 'product-files' );
create policy "Product files upload" on storage.objects for insert with check ( bucket_id = 'product-files' );
