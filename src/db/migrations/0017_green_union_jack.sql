ALTER TABLE "cash_closings" ADD COLUMN "status" text DEFAULT 'activo' NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD COLUMN "reversed_at" text;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD COLUMN "reversed_by" text;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD COLUMN "reversal_reason" text;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_reversed_by_user_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;