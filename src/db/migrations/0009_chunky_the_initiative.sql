CREATE TABLE "investment_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"date" text NOT NULL,
	"destination" text NOT NULL,
	"amount" double precision NOT NULL,
	"supplier" text,
	"description" text NOT NULL,
	"payment_method" text NOT NULL,
	"invoice_ref" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "investment_liquidation_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"liquidation_id" text NOT NULL,
	"group_id" text NOT NULL,
	"percentage" double precision NOT NULL,
	"assigned_amount" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_liquidations" (
	"id" text PRIMARY KEY NOT NULL,
	"period_id" text NOT NULL,
	"gross_sales" double precision NOT NULL,
	"distributable_income" double precision NOT NULL,
	"closed_at" text NOT NULL,
	"closed_by" text NOT NULL,
	CONSTRAINT "investment_liquidations_period_id_unique" UNIQUE("period_id")
);
--> statement-breakpoint
CREATE TABLE "investment_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"liquidation_share_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" text NOT NULL,
	"payment_method" text,
	"origin_account" text,
	"target_period_id" text,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "investment_applications" ADD CONSTRAINT "investment_applications_period_id_investment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."investment_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_liquidation_shares" ADD CONSTRAINT "investment_liquidation_shares_liquidation_id_investment_liquidations_id_fk" FOREIGN KEY ("liquidation_id") REFERENCES "public"."investment_liquidations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_liquidation_shares" ADD CONSTRAINT "investment_liquidation_shares_group_id_investment_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."investment_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_liquidations" ADD CONSTRAINT "investment_liquidations_period_id_investment_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."investment_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_liquidations" ADD CONSTRAINT "investment_liquidations_closed_by_user_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_payments" ADD CONSTRAINT "investment_payments_liquidation_share_id_investment_liquidation_shares_id_fk" FOREIGN KEY ("liquidation_share_id") REFERENCES "public"."investment_liquidation_shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_payments" ADD CONSTRAINT "investment_payments_target_period_id_investment_periods_id_fk" FOREIGN KEY ("target_period_id") REFERENCES "public"."investment_periods"("id") ON DELETE no action ON UPDATE no action;