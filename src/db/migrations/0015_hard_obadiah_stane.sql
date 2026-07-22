ALTER TABLE "purchase_order_lines" ADD COLUMN "purchase_mode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD COLUMN "units_per_package" integer NOT NULL;