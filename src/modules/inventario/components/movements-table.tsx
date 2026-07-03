"use client";

import type { FilterFn } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { useProductStore } from "@/stores/product-store";
import type { StockMovement } from "@/types";
import { useAllMovements } from "../hooks/use-stock-movements";
import { movementAuthorsMock } from "../mock-data/movement-authors.mock";
import { buildMovementsColumns } from "./movements-table-columns";

const globalFilterFn: FilterFn<StockMovement> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { note } = row.original;
	return (note ?? "").toLowerCase().includes(search);
};

export function MovementsTable() {
	const movements = useAllMovements();
	const products = useProductStore((state) => state.products);

	const sortedMovements = useMemo(
		() => [...movements].sort((a, b) => b.date.localeCompare(a.date)),
		[movements],
	);

	const columns = useMemo(
		() => buildMovementsColumns({ products, users: movementAuthorsMock }),
		[products],
	);

	return (
		<DataTable
			columns={columns}
			data={sortedMovements}
			searchPlaceholder="Buscar por nota..."
			globalFilterFn={globalFilterFn}
			emptyMessage="No hay movimientos registrados."
		/>
	);
}
