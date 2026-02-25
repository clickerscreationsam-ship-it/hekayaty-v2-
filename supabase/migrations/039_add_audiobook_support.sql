-- Migration: 039_add_audiobook_support.sql
-- Description: Adds 'audiobook' support to the products table and necessary columns.

-- 1. Add new columns for audiobook support (if they don't exist)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audio_duration INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audio_preview_url TEXT;

-- 2. Update the 'products_type_check' constraint to include 'audiobook'
-- First, drop the old constraint by name if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_type_check') THEN
        ALTER TABLE public.products DROP CONSTRAINT products_type_check;
    END IF;
END $$;

-- Add the updated constraint including 'audiobook'
ALTER TABLE public.products ADD CONSTRAINT products_type_check 
CHECK (type IN ('ebook', 'asset', 'bundle', 'physical', 'promotional', 'merchandise', 'audiobook'));
