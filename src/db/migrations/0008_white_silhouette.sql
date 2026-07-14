CREATE TABLE "investment_contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"group_id" text NOT NULL,
	"date" text NOT NULL,
	"amount" double precision NOT NULL,
	"type" text NOT NULL,
	"payment_method" text NOT NULL,
	"receiving_account" text,
	"invoice_ref" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "investment_period_participations" (
	"period_id" text NOT NULL,
	"group_id" text NOT NULL,
	"agreed_percentage" double precision NOT NULL,
	CONSTRAINT "investment_period_participations_period_id_group_id_pk" PRIMARY KEY("period_id","group_id")
);
--> statement-breakpoint
ALTER TABLE "investment_contributions" ADD CONSTRAINT "investment_contributions_period_id_investment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."investment_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_contributions" ADD CONSTRAINT "investment_contributions_group_id_investment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."investment_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_period_participations" ADD CONSTRAINT "investment_period_participations_period_id_investment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."investment_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_period_participations" ADD CONSTRAINT "investment_period_participations_group_id_investment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."investment_groups"("id") ON DELETE no action ON UPDATE no action;