"use client";

import type { FilterFn } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { InventoryIndicatorRow } from "@/data/repositories/rentabilidad-dashboard-repository";
import { buildInventoryIndicatorsColumns } from "./inventory-indicators-columns";

const globalFilterFn: FilterFn<InventoryIndicatorRow> = (
	row,
	_columnId,
	value,
) => row.original.name.toLowerCase().includes(String(value).toLowerCase());

/** Sell-through, velocidad, cobertura, rotación y antigüedad por producto — ventana fija de 30
 * días, independiente del período elegido en el dashboard (ver JSDoc del repositorio). */
export function InventoryIndicatorsTable({
	data,
}: {
	data: InventoryIndicatorRow[];
}) {
	const columns = useMemo(() => buildInventoryIndicatorsColumns(), []);

	return (
		<DataTable
			columns={columns}
			data={data}
			searchPlaceholder="Buscar producto..."
			globalFilterFn={globalFilterFn}
			emptyMessage="No hay productos activos."
		/>
	);
}
