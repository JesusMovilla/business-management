export interface RevenuePoint {
	date: string;
	income: number;
}

export interface TopProduct {
	productId: string;
	name: string;
	presentation: string;
	quantitySold: number;
}

export interface DashboardKpis {
	revenueThisMonth: number;
	unitsSoldThisMonth: number;
	lowStockCount: number;
	criticalStockCount: number;
	inventoryValue: number;
}
