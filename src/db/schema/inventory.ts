import {
	boolean,
	doublePrecision,
	integer,
	pgTable,
	text,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const categories = pgTable("categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
});

export const products = pgTable("products", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	brand: text("brand").notNull(),
	categoryId: text("category_id")
		.notNull()
		.references(() => categories.id),
	presentation: text("presentation").notNull(),
	volumeMl: integer("volume_ml"),
	minStock: integer("min_stock").notNull(),
	cost: doublePrecision("cost").notNull(),
	retailPrice: doublePrecision("retail_price").notNull(),
	lastPurchaseDate: text("last_purchase_date"),
	imageUrl: text("image_url"),
	active: boolean("active").notNull().default(true),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
});

export const stockMovements = pgTable("stock_movements", {
	id: text("id").primaryKey(),
	// Sin FK a `products`: el ledger es append-only y sobrevive a la eliminación de su producto
	// (ver docs/DECISIONS.md) — un FK con acción por defecto (RESTRICT) bloquearía ese borrado.
	productId: text("product_id").notNull(),
	type: text("type").notNull(),
	delta: integer("delta").notNull(),
	date: text("date").notNull(),
	reason: text("reason"),
	note: text("note"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
});
