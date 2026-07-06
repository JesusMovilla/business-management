"use client";

import type { FilterFn } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { StockMovement } from "@/types";
import { useProducts } from "../hooks/use-products";
import {
	useAllMovements,
	useMovementAuthors,
} from "../hooks/use-stock-movements";
import { buildMovementsColumns } from "./movements-table-columns";

const globalFilterFn: FilterFn<StockMovement> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { note } = row.original;
	return (note ?? "").toLowerCase().includes(search);
};

export function MovementsTable() {
	const movements = useAllMovements();
	const products = useProducts();
	const users = useMovementAuthors();

	const sortedMovements = useMemo(
		() => movements.toSorted((a, b) => b.date.localeCompare(a.date)),
		[movements],
	);

	const columns = useMemo(
		() => buildMovementsColumns({ products, users }),
		[products, users],
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
