CREATE TABLE "debtor_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"debtor_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" text NOT NULL,
	"note" text,
	"cash_closing_id" text,
	"created_at" text NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debtors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"balance" double precision DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "debtor_movements" ADD CONSTRAINT "debtor_movements_debtor_id_debtors_id_fk" FOREIGN KEY ("debtor_id") REFERENCES "public"."debtors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debtor_movements" ADD CONSTRAINT "debtor_movements_cash_closing_id_cash_closings_id_fk" FOREIGN KEY ("cash_closing_id") REFERENCES "public"."cash_closings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debtor_movements" ADD CONSTRAINT "debtor_movements_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debtors" ADD CONSTRAINT "debtors_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debtors" ADD CONSTRAINT "debtors_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;