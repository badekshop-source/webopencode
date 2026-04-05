-- Migration: Add missing columns and tables
-- Generated: April 2026

-- Add missing columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "nationality" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "arrival_date" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "flight_number" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "imei_number" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "access_token" text DEFAULT '';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "token_expires_at" timestamp;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "qr_code_data" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_reminder_sent" boolean DEFAULT false;

-- Add features column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "features" json;

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_name" text NOT NULL,
	"user_email" text NOT NULL,
	"country" text NOT NULL,
	"rating" integer NOT NULL,
	"trip_type" text NOT NULL,
	"trip_duration" text NOT NULL,
	"review_text" text NOT NULL,
	"is_approved" boolean DEFAULT false,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key for reviews
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;

-- Update customer_name to full_name if needed (data migration)
UPDATE "orders" SET "full_name" = "customer_name" WHERE "full_name" IS NULL AND "customer_name" IS NOT NULL;
