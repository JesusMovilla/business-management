import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import type { CashClosingItem, CashClosingSale } from "@/types";

// Anchos consistentes entre la tabla de cada venta y el detalle por producto, para que las
// columnas queden alineadas visualmente aunque cada venta sea una tabla independiente (ver
// `docs/DECISIONS.md`).
export const COL_QUANTITY = "w-24";
export const COL_UNIT_PRICE = "w-32 text-right";
export const COL_SUBTOTAL = "w-32 text-right";
export const COL_ACTIONS = "w-12";

export function productLabel(product?: ProductWithQuantity): string {
	return product
		? `${product.name} (${product.presentation})`
		: "Producto eliminado";
}

export interface SaleGroup {
	key: string;
	sale?: CashClosingSale;
	items: CashClosingItem[];
	total: number;
	createdAt?: string;
}

/**
 * Agrupa los ítems de un cierre por venta (`saleId`) para mostrarlos juntos — una venta puede
 * incluir varios productos. Ítems sin `saleId` (de antes de esta columna, o reescritos por una
 * edición de Administrador que aplana la lista, ver `cashClosingRepository.update`) se muestran
 * como una venta de un solo ítem, usando su propio id como clave.
 */
export function groupItemsBySale(
	items: CashClosingItem[],
	sales: CashClosingSale[],
): SaleGroup[] {
	const salesById = new Map(sales.map((sale) => [sale.id, sale]));
	const groups = new Map<string, CashClosingItem[]>();
	for (const item of items) {
		const key = item.saleId ?? item.id;
		const existing = groups.get(key);
		if (existing) existing.push(item);
		else groups.set(key, [item]);
	}
	return [...groups.entries()]
		.map(([key, saleItems]) => ({
			key,
			sale: salesById.get(key),
			items: saleItems,
			total: saleItems.reduce(
				(sum, item) => sum + item.quantitySold * item.unitPrice,
				0,
			),
			createdAt: saleItems[0]?.createdAt,
		}))
		.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

export interface ProductSummary {
	productId: string;
	quantitySold: number;
	subtotal: number;
}

/** Agrega todos los ítems de un cierre por producto — cantidad total, subtotal y total final. */
export function summarizeByProduct(items: CashClosingItem[]): ProductSummary[] {
	const summaries = new Map<string, ProductSummary>();
	for (const item of items) {
		const subtotal = item.quantitySold * item.unitPrice;
		const existing = summaries.get(item.productId);
		if (existing) {
			existing.quantitySold += item.quantitySold;
			existing.subtotal += subtotal;
		} else {
			summaries.set(item.productId, {
				productId: item.productId,
				quantitySold: item.quantitySold,
				subtotal,
			});
		}
	}
	return [...summaries.values()];
}
