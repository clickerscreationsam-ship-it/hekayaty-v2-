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
