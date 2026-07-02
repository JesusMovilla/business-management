"use client";

import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
	table: Table<TData>;
	searchPlaceholder?: string;
	children?: ReactNode;
}

/**
 * Barra superior estándar de `DataTable`: búsqueda global + acciones propias de la tabla
 * (`children`) a la izquierda, botón de limpiar filtros cuando hay alguno activo, y
 * `DataTableViewOptions` a la derecha.
 */
export function DataTableToolbar<TData>({
	table,
	searchPlaceholder,
	children,
}: DataTableToolbarProps<TData>) {
	const hasActiveFilters =
		table.getState().columnFilters.length > 0 ||
		!!table.getState().globalFilter;

	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="flex flex-wrap items-center gap-2">
				{searchPlaceholder && (
					<Input
						placeholder={searchPlaceholder}
						value={table.getState().globalFilter ?? ""}
						onChange={(event) => table.setGlobalFilter(event.target.value)}
						className="h-8 max-w-xs"
					/>
				)}
				{children}
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							table.resetColumnFilters();
							table.resetGlobalFilter();
						}}
					>
						Limpiar filtros
						<X className="size-3.5" />
					</Button>
				)}
			</div>
			<DataTableViewOptions table={table} />
		</div>
	);
}
