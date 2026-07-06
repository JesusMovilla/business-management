import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { products, stockMovements } from "@/db/schema";
import type { NewProductInput, Product } from "@/types";

export type ProductWithQuantity = Product & {
	stock: Product["stock"] & { quantity: number };
};

function toProduct(row: typeof products.$inferSelect): Product {
	return {
		id: row.id,
		sku: row.sku,
		name: row.name,
		brand: row.brand,
		categoryId: row.categoryId,
		presentation: row.presentation,
		volumeMl: row.volumeMl ?? undefined,
		stock: { minStock: row.minStock, warehouseLocation: row.warehouseLocation },
		pricing: {
			cost: row.cost,
			retailPrice: row.retailPrice,
			wholesalePrice: row.wholesalePrice,
		},
		supplierId: row.supplierId,
		lastPurchaseDate: row.lastPurchaseDate ?? undefined,
		imageUrl: row.imageUrl ?? undefined,
		active: row.active,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function toRow(input: NewProductInput) {
	return {
		sku: input.sku,
		name: input.name,
		brand: input.brand,
		categoryId: input.categoryId,
		presentation: input.presentation,
		volumeMl: input.volumeMl ?? null,
		minStock: input.stock.minStock,
		warehouseLocation: input.stock.warehouseLocation,
		cost: input.pricing.cost,
		retailPrice: input.pricing.retailPrice,
		wholesalePrice: input.pricing.wholesalePrice,
		supplierId: input.supplierId,
		lastPurchaseDate: input.lastPurchaseDate ?? null,
		imageUrl: input.imageUrl ?? null,
		active: input.active,
	};
}

function nowIso() {
	return new Date().toISOString();
}

export const productRepository = {
	async listWithQuantity(): Promise<ProductWithQuantity[]> {
		const rows = await db
			.select({
				product: products,
				quantity: sql<number>`coalesce(sum(${stockMovements.delta}), 0)`,
			})
			.from(products)
			.leftJoin(stockMovements, eq(stockMovements.productId, products.id))
			.groupBy(products.id);

		return rows.map(({ product, quantity }) => {
			const base = toProduct(product);
			return { ...base, stock: { ...base.stock, quantity: Number(quantity) } };
		});
	},

	async create(input: NewProductInput): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		await db
			.insert(products)
			.values({ ...toRow(input), id, createdAt: now, updatedAt: now });
		return id;
	},

	/** Inserta el producto y, si hay cantidad inicial, su primer movimiento `entrada` — atómico. */
	async createWithInitialEntry(
		input: NewProductInput,
		initialQuantity: number,
		userId: string,
	): Promise<string> {
		const id = crypto.randomUUID();
		const now = nowIso();
		await db.transaction(async (tx) => {
			await tx
				.insert(products)
				.values({ ...toRow(input), id, createdAt: now, updatedAt: now });
			if (initialQuantity > 0) {
				await tx.insert(stockMovements).values({
					id: crypto.randomUUID(),
					productId: id,
					type: "entrada",
					delta: initialQuantity,
					date: now,
					note: "Alta inicial de producto",
					userId,
				});
			}
		});
		return id;
	},

	async update(id: string, patch: Partial<NewProductInput>): Promise<void> {
		const row: Record<string, unknown> = { updatedAt: nowIso() };
		if (patch.sku !== undefined) row.sku = patch.sku;
		if (patch.name !== undefined) row.name = patch.name;
		if (patch.brand !== undefined) row.brand = patch.brand;
		if (patch.categoryId !== undefined) row.categoryId = patch.categoryId;
		if (patch.presentation !== undefined) row.presentation = patch.presentation;
		if (patch.volumeMl !== undefined) row.volumeMl = patch.volumeMl;
		if (patch.stock?.minStock !== undefined)
			row.minStock = patch.stock.minStock;
		if (patch.stock?.warehouseLocation !== undefined)
			row.warehouseLocation = patch.stock.warehouseLocation;
		if (patch.pricing?.cost !== undefined) row.cost = patch.pricing.cost;
		if (patch.pricing?.retailPrice !== undefined)
			row.retailPrice = patch.pricing.retailPrice;
		if (patch.pricing?.wholesalePrice !== undefined)
			row.wholesalePrice = patch.pricing.wholesalePrice;
		if (patch.supplierId !== undefined) row.supplierId = patch.supplierId;
		if (patch.lastPurchaseDate !== undefined)
			row.lastPurchaseDate = patch.lastPurchaseDate;
		if (patch.active !== undefined) row.active = patch.active;

		await db.update(products).set(row).where(eq(products.id, id));
	},

	async remove(id: string): Promise<void> {
		await db.delete(products).where(eq(products.id, id));
	},
};
