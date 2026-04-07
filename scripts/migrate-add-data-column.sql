-- Migration: Add 'data' column to products table
-- Date: April 2026
-- Phase: 1 - Critical Features

-- Add data column if it doesn't exist
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "data" TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN "products"."data" IS 'Data allowance: Unlimited, 1GB, 3GB, 5GB, 10GB, 20GB, 50GB, 100GB';

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS "idx_products_data" ON "products" ("data");

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'data';