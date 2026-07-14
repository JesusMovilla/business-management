CREATE TABLE "profit_payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"amount" double precision NOT NULL,
	"group_id" text NOT NULL,
	"note" text NOT NULL,
	"status" text NOT NULL,
	"void_reason" text,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "profit_payouts" ADD CONSTRAINT "profit_payouts_group_id_investment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."investment_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_payouts" ADD CONSTRAINT "profit_payouts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_payouts" ADD CONSTRAINT "profit_payouts_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;