ALTER TABLE "purchase_order_lines" ADD COLUMN "previous_unit_cost" double precision;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "reversed_at" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "reversed_by" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "reversal_reason" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_reversed_by_user_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;