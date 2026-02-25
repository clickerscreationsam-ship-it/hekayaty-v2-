-- Migration to add audio_parts to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS audio_parts JSONB DEFAULT '[]'::jsonb;
