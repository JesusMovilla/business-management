ALTER TABLE "products" DROP CONSTRAINT "products_sku_unique";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_supplier_id_suppliers_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "warehouse_location";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "wholesale_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "supplier_id";--> statement-breakpoint
DROP TABLE "suppliers";