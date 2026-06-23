-- Add new columns for Collections System
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "slug" text UNIQUE;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "label" text;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "collection_type" text DEFAULT 'custom';
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "banner_image_url" text;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "original_total_price" integer DEFAULT 0;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "start_date" timestamp;
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "end_date" timestamp;

-- Change price column from numeric to integer to match products table
ALTER TABLE "collections" ALTER COLUMN "price" TYPE integer USING COALESCE(price::integer, 0);
ALTER TABLE "collections" ALTER COLUMN "price" SET DEFAULT 0;
ALTER TABLE "collections" ALTER COLUMN "price" SET NOT NULL;

-- Add snapshot_price to collection_items
ALTER TABLE "collection_items" ADD COLUMN IF NOT EXISTS "snapshot_price" integer DEFAULT 0;
