"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

const PAGE_SIZES = [10, 20, 50];

/**
 * Controles de paginación (tamaño de página, anterior/siguiente, conteo de filas); usado
 * internamente por `DataTable`.
 */
export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	const pageCount = table.getPageCount();
	const totalRows = table.getFilteredRowModel().rows.length;
	if (totalRows === 0) return null;

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 px-1">
			<span className="text-muted-foreground text-sm">
				{totalRows} fila{totalRows === 1 ? "" : "s"}
			</span>
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">
						Filas por página
					</span>
					<Select
						value={String(table.getState().pagination.pageSize)}
						onValueChange={(value) =>
							table.setPageSize(Number(value as string))
						}
					>
						<SelectTrigger size="sm" className="w-[70px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZES.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<span className="text-muted-foreground text-sm">
					Página {table.getState().pagination.pageIndex + 1} de{" "}
					{Math.max(pageCount, 1)}
				</span>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon-sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
