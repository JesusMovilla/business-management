"use client";

import { useMemo, useState } from "react";
import type { ProductWithMargin, StockStatus } from "@/types";

export interface ProductFilters {
	search: string;
	categoryId: string | "all";
	supplierId: string | "all";
	stockStatus: StockStatus | "all";
}

const DEFAULT_FILTERS: ProductFilters = {
	search: "",
	categoryId: "all",
	supplierId: "all",
	stockStatus: "all",
};

export function useProductFilters(products: ProductWithMargin[]) {
	const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

	const filtered = useMemo(() => {
		const search = filters.search.trim().toLowerCase();
		return products.filter((product) => {
			if (search) {
				const haystack =
					`${product.name} ${product.sku} ${product.brand}`.toLowerCase();
				if (!haystack.includes(search)) return false;
			}
			if (
				filters.categoryId !== "all" &&
				product.categoryId !== filters.categoryId
			)
				return false;
			if (
				filters.supplierId !== "all" &&
				product.supplierId !== filters.supplierId
			)
				return false;
			if (
				filters.stockStatus !== "all" &&
				product.stockStatus !== filters.stockStatus
			)
				return false;
			return true;
		});
	}, [products, filters]);

	return { filters, setFilters, filtered };
}
