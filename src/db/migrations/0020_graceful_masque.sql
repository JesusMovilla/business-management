CREATE TABLE "cash_closing_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"cash_closing_id" text NOT NULL,
	"payment_method" text NOT NULL,
	"note" text,
	"created_at" text NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_closing_sales" ADD CONSTRAINT "cash_closing_sales_cash_closing_id_cash_closings_id_fk" FOREIGN KEY ("cash_closing_id") REFERENCES "public"."cash_closings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_closing_sales" ADD CONSTRAINT "cash_closing_sales_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_closing_items" ADD CONSTRAINT "cash_closing_items_sale_id_cash_closing_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."cash_closing_sales"("id") ON DELETE cascade ON UPDATE no action;