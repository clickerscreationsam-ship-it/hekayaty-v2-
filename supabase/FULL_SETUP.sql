-- Hekayaty Store Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS TABLE (Enhanced with Supabase Auth)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
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
  type TEXT NOT NULL DEFAULT 'ebook' CHECK (type IN ('ebook', 'asset', 'bundle')),
  genre TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  rating INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price INTEGER NOT NULL, -- Price in cents
  license_type TEXT DEFAULT 'personal' CHECK (license_type IN ('personal', 'commercial', 'standard', 'extended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products
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
  platform_fee INTEGER NOT NULL, -- 20% of total
  creator_earnings INTEGER NOT NULL, -- 80% of total
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id TEXT,
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
-- 7. REVIEWS
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
-- 8. SOCIAL FEATURES
-- =============================================

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, creator_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_creator ON follows(creator_id);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
CREATE INDEX idx_likes_product ON likes(product_id);

-- Saved Library
CREATE TABLE IF NOT EXISTS saved_library (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_library_user ON saved_library(user_id);

-- =============================================
-- 9. COUPONS
-- =============================================
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  writer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_coupons_writer ON coupons(writer_id);
CREATE INDEX idx_coupons_code ON coupons(code);

-- =============================================
-- 10. EARNINGS (For Creator Payouts)
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
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to products table
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users: Everyone can read public profiles, users can update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Products: Everyone can read published products
CREATE POLICY "Published products are viewable by everyone"
  ON products FOR SELECT
  USING (is_published = true OR writer_id = auth.uid());

CREATE POLICY "Users can create own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = writer_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = writer_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = writer_id);

-- Cart: Users can only access their own cart
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own cart"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Order Items: Users can view items from their orders
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample users (you'll create these through Supabase Auth UI)
-- The actual user creation will happen through your app's sign-up flow

COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE products IS 'Products (eBooks, assets, bundles)';
COMMENT ON TABLE orders IS 'Customer orders with 20% platform fee';
COMMENT ON TABLE earnings IS 'Creator earnings tracking (80% of sales)';
-- Fix RLS Policies for User Registration
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate policies with INSERT support

-- 1. Allow anyone to INSERT (for registration)
CREATE POLICY "Enable insert for authenticated users during registration"
  ON users FOR INSERT
  WITH CHECK (true);

-- 2. Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- 3. Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- 4. Users can delete their own profile (optional, for account deletion)
CREATE POLICY "Users can delete own profile"
  ON users FOR DELETE
  USING (auth.uid() = id);
-- Create storage buckets for user content
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('store-banners', 'store-banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', true)
on conflict (id) do nothing;

-- Set up security policies for Avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Users can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' );

-- Set up security policies for Store Banners
create policy "Store banners are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'store-banners' );

create policy "Anyone can upload a banner."
  on storage.objects for insert
  with check ( bucket_id = 'store-banners' );

create policy "Users can update their own banner."
  on storage.objects for update
  using ( bucket_id = 'store-banners' );

-- Set up security policies for Product Files
create policy "Product files are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'product-files' );

create policy "Anyone can upload a product file."
  on storage.objects for insert
  with check ( bucket_id = 'product-files' );
-- Add content column for storing extracted text
ALTER TABLE products ADD COLUMN IF NOT EXISTS content TEXT;

-- Update type check constraint to include 'physical'
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
ALTER TABLE products ADD CONSTRAINT products_type_check CHECK (type IN ('ebook', 'asset', 'bundle', 'physical'));
-- Add Economic System columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS commission_rate integer DEFAULT 20;

-- Add Sales Logic to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_price integer,
ADD COLUMN IF NOT EXISTS sale_ends_at timestamp with time zone;

-- Create Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- in cents
  status text DEFAULT 'pending', -- pending, processed, rejected
  method text DEFAULT 'stripe',
  requested_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at timestamp with time zone
);

-- Enable RLS on Payouts
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Payouts Policies
CREATE POLICY "Users can view their own payouts"
  ON payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payout requests"
  ON payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins/service role can update payouts (process them)
-- No policy for UPDATE for normal users, effectively limiting them.
-- Create Local Payment System columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card', -- 'instapay', 'vodafone_cash', 'card', etc.
ADD COLUMN IF NOT EXISTS payment_proof_url text, -- Screenshot URL
ADD COLUMN IF NOT EXISTS payment_reference text, -- Transaction ID
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Allow status to reflect payment workflow
-- Status can be: 'pending_payment', 'pending_verification', 'paid', 'rejected', 'completed'
-- Ensure the admin role is allowed in the users table check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('reader', 'writer', 'artist', 'admin'));
