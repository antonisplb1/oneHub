ALTER TABLE "stores" ADD COLUMN "selected_products" text[] DEFAULT ARRAY[]::text[];--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;