import type { ProductStock, StockStatus } from "@/types";

export function getStockStatus(stock: ProductStock): StockStatus {
	if (stock.quantity <= 0) return "critico";
	if (stock.quantity <= stock.minStock) return "bajo";
	return "ok";
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
	ok: "OK",
	bajo: "Stock bajo",
	critico: "Crítico",
};
