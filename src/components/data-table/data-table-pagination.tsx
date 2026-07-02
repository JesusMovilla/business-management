"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
	table: Table<TData>;
}

export function DataTablePagination<TData>({
	table,
}: DataTablePaginationProps<TData>) {
	const pageCount = table.getPageCount();
	if (pageCount <= 1) return null;

	return (
		<div className="flex items-center justify-between px-1">
			<span className="text-muted-foreground text-sm">
				Página {table.getState().pagination.pageIndex + 1} de {pageCount}
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
	);
}
