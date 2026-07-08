"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import type { CashClosingSummary } from "@/data/repositories/cash-closing-repository";
import { buildCashClosingColumns } from "./cash-closing-table-columns";

const globalFilterFn: FilterFn<CashClosingSummary> = (
	row,
	_columnId,
	value,
) => {
	const search = String(value).toLowerCase();
	const { date, reason } = row.original;
	return `${date} ${reason ?? ""}`.toLowerCase().includes(search);
};

interface CashClosingTableProps {
	cashClosings: CashClosingSummary[];
}

export function CashClosingTable({ cashClosings }: CashClosingTableProps) {
	const router = useRouter();
	const columns = useMemo(() => buildCashClosingColumns(), []);

	return (
		<DataTable
			columns={columns}
			data={cashClosings}
			searchPlaceholder="Buscar por fecha o motivo..."
			globalFilterFn={globalFilterFn}
			emptyMessage="No hay cierres de caja registrados."
			onRowClick={(closing) => router.push(`/cierre-caja/${closing.id}`)}
			toolbarActions={
				<PermissionGuard module="cierre-caja" action="crear">
					<Button size="sm" render={<Link href="/cierre-caja/nuevo" />}>
						<Plus className="size-4" />
						Nuevo cierre
					</Button>
				</PermissionGuard>
			}
		/>
	);
}
