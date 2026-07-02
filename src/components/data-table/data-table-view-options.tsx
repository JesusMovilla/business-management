"use client";

import type { Table } from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
}

/**
 * Dropdown para mostrar/ocultar columnas. Es el único lugar para volver a mostrar una
 * columna oculta desde el menú de cabecera (`DataTableColumnHeader`).
 */
export function DataTableViewOptions<TData>({
	table,
}: DataTableViewOptionsProps<TData>) {
	const hideableColumns = table
		.getAllColumns()
		.filter((column) => column.getCanHide());

	if (!hideableColumns.length) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline" size="sm">
						<SlidersHorizontal className="size-3.5" />
						Columnas
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="min-w-40">
				<DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{hideableColumns.map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						checked={column.getIsVisible()}
						onCheckedChange={(checked) => column.toggleVisibility(checked)}
					>
						{column.columnDef.meta?.title ?? column.id}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
