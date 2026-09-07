ALTER TABLE "cash_closing_items" ADD COLUMN "created_at" text;--> statement-breakpoint
ALTER TABLE "cash_closing_items" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "cash_closing_items" ADD CONSTRAINT "cash_closing_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;