"use client";

import type { FilterFn } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { ProductWithMargin } from "@/types";
import { useCategories, useProducts } from "../hooks/use-products";
import { buildPriceMarginColumns } from "./price-margin-table-columns";

const globalFilterFn: FilterFn<ProductWithMargin> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { sku, name } = row.original;
	return `${sku} ${name}`.toLowerCase().includes(search);
};

export function PriceMarginTable() {
	const products = useProducts();
	const categories = useCategories();
	const columns = useMemo(
		() => buildPriceMarginColumns({ categories }),
		[categories],
	);

	return (
		<DataTable
			columns={columns}
			data={products}
			searchPlaceholder="Buscar por nombre o SKU..."
			globalFilterFn={globalFilterFn}
			emptyMessage="No se encontraron productos con estos filtros."
		/>
	);
}
