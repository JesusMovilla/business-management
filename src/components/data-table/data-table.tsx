"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type FilterFn,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DataTableMobileCards } from "./data-table-mobile-cards";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onRowClick?: (row: TData) => void;
	emptyMessage?: string;
	/** Habilita el buscador global en la toolbar y define su placeholder. */
	searchPlaceholder?: string;
	/** Función custom de búsqueda global; default: busca en todas las columnas visibles. */
	globalFilterFn?: FilterFn<TData>;
	/** Controles propios de la tabla (p. ej. un botón "+ Nuevo"), renderizados en la toolbar. */
	toolbarActions?: ReactNode;
}

/**
 * Tabla estandarizada sobre TanStack Table: orden y filtro por columna vía
 * `DataTableColumnHeader` en cada `columnDef.header`, visibilidad de columnas
 * (`DataTableViewOptions`), búsqueda global opcional y paginación. Preferir esta antes de
 * construir una tabla a mano. Acciones por fila: usar `DataTableRowActions` en una columna
 * `id: "actions"`.
 * @param searchPlaceholder si se pasa, habilita el input de búsqueda global en la toolbar.
 * @param toolbarActions controles adicionales (botones, etc.) en la toolbar de la tabla.
 */
export function DataTable<TData, TValue>({
	columns,
	data,
	onRowClick,
	emptyMessage = "No hay resultados.",
	searchPlaceholder,
	globalFilterFn,
	toolbarActions,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	const table = useReactTable({
		data,
		columns,
		state: { sorting, columnFilters, globalFilter, columnVisibility },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onColumnVisibilityChange: setColumnVisibility,
		globalFilterFn,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 10 } },
	});

	const showToolbar =
		!!searchPlaceholder ||
		!!toolbarActions ||
		table.getAllColumns().some((column) => column.getCanHide());

	return (
		<div className="flex flex-col gap-3">
			{showToolbar && (
				<DataTableToolbar table={table} searchPlaceholder={searchPlaceholder}>
					{toolbarActions}
				</DataTableToolbar>
			)}
			<div className="flex flex-wrap items-center gap-1 sm:hidden">
				{table
					.getHeaderGroups()[0]
					?.headers.flatMap((header) =>
						header.column.id === "actions"
							? []
							: [
									<div key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</div>,
								],
					)}
			</div>
			<div className="sm:hidden">
				<DataTableMobileCards
					table={table}
					onRowClick={onRowClick}
					emptyMessage={emptyMessage}
				/>
			</div>
			<div className="hidden rounded-md border sm:block">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									onClick={() => onRowClick?.(row.original)}
									className={onRowClick ? "cursor-pointer" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyMessage}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
