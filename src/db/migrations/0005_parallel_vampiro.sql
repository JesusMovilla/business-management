CREATE TABLE "cash_closing_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_closing_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity_sold" integer NOT NULL,
	"unit_price" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_closings" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"expected_income" double precision NOT NULL,
	"actual_cash" double precision NOT NULL,
	"difference" double precision NOT NULL,
	"reason" text,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "cash_closing_items" ADD CONSTRAINT "cash_closing_items_cash_closing_id_cash_closings_id_fk" FOREIGN KEY ("cash_closing_id") REFERENCES "public"."cash_closings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;