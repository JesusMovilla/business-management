export interface RevenuePoint {
	date: string;
	income: number;
}

export interface TopProduct {
	productId: string;
	name: string;
	quantitySold: number;
}

export interface ReconciliationBreakdown {
	ok: number;
	sobrante: number;
	faltante: number;
}

export interface CategoryStock {
	categoryId: string;
	categoryName: string;
	quantity: number;
}

export interface TopSalesDay {
	closingId: string;
	date: string;
	expectedIncome: number;
}

export interface DashboardKpis {
	revenueThisMonth: number;
	unitsSoldThisMonth: number;
	lowStockCount: number;
	criticalStockCount: number;
	inventoryValue: number;
}
