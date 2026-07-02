"use client";

import type { Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataTableMobileCardsProps<TData> {
	table: Table<TData>;
	onRowClick?: (row: TData) => void;
	emptyMessage: string;
}

/**
 * Vista de tarjetas para pantallas chicas, usada por `DataTable` en vez de forzar scroll
 * horizontal en una tabla angosta. La primera columna visible (que no sea `id: "actions"`) se
 * destaca como título de la tarjeta; el resto se muestra en una grilla de etiqueta/valor.
 */
export function DataTableMobileCards<TData>({
	table,
	onRowClick,
	emptyMessage,
}: DataTableMobileCardsProps<TData>) {
	const rows = table.getRowModel().rows;

	if (!rows.length) {
		return (
			<div className="rounded-md border p-8 text-center text-muted-foreground text-sm">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{rows.map((row) => {
				const cells = row.getVisibleCells();
				const actionsCell = cells.find((cell) => cell.column.id === "actions");
				const otherCells = cells.filter((cell) => cell.column.id !== "actions");
				const [primaryCell, ...fieldCells] = otherCells;

				return (
					<Card
						key={row.id}
						onClick={() => onRowClick?.(row.original)}
						className={cn("gap-3 p-4", onRowClick && "cursor-pointer")}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								{primaryCell &&
									flexRender(
										primaryCell.column.columnDef.cell,
										primaryCell.getContext(),
									)}
							</div>
							{actionsCell &&
								flexRender(
									actionsCell.column.columnDef.cell,
									actionsCell.getContext(),
								)}
						</div>
						{fieldCells.length > 0 && (
							<div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3">
								{fieldCells.map((cell) => (
									<div key={cell.id} className="min-w-0">
										<div className="text-muted-foreground text-xs">
											{cell.column.columnDef.meta?.title ?? cell.column.id}
										</div>
										<div className="truncate text-sm">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</Card>
				);
			})}
		</div>
	);
}
