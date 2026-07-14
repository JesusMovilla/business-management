DROP TABLE "expense_budgets" CASCADE;--> statement-breakpoint
DROP TABLE "investment_applications" CASCADE;--> statement-breakpoint
ALTER TABLE "investment_contributions" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "investment_contributions" DROP COLUMN "payment_method";--> statement-breakpoint
ALTER TABLE "investment_contributions" DROP COLUMN "receiving_account";--> statement-breakpoint
ALTER TABLE "investment_contributions" DROP COLUMN "invoice_ref";