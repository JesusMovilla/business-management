"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";
import type { PurchaseOrder } from "@/types";
import { purchaseOrderTotal } from "@/types";
import { usePurchaseOrdersController } from "../hooks/use-purchase-orders";
import { PurchaseOrderFormDialog } from "./purchase-order-form-dialog";
import { PurchaseOrderReceiveDialog } from "./purchase-order-receive-dialog";
import {
	buildPurchaseOrderColumns,
	PURCHASE_ORDER_STATUS_LABELS,
} from "./purchase-order-table-columns";

const globalFilterFn: FilterFn<PurchaseOrder> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { supplier, note } = row.original;
	return `${supplier} ${note ?? ""}`.toLowerCase().includes(search);
};

interface PurchaseOrderTableProps {
	initialOrders: PurchaseOrder[];
}

export function PurchaseOrderTable({ initialOrders }: PurchaseOrderTableProps) {
	const {
		purchaseOrders,
		addPurchaseOrder,
		updatePurchaseOrder,
		cancelPurchaseOrder,
		receivePurchaseOrder,
		removePurchaseOrder,
		isPending,
	} = usePurchaseOrdersController(initialOrders);

	const [formOpen, setFormOpen] = useState(false);
	const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
	const [orderToReceive, setOrderToReceive] = useState<PurchaseOrder | null>(
		null,
	);
	// Cambia en cada apertura para forzar el remount de `PurchaseOrderFormDialog` (ver su JSDoc).
	const [formSessionId, setFormSessionId] = useState(0);

	const handleExportCsv = () => {
		const header = [
			"Proveedor",
			"Fecha del pedido",
			"Productos",
			"Total",
			"Estado",
			"Fecha de recepción",
			"Nota",
		];
		const rows = purchaseOrders.map((order) => [
			order.supplier,
			order.orderDate,
			String(order.lines.length),
			String(purchaseOrderTotal(order)),
			PURCHASE_ORDER_STATUS_LABELS[order.status],
			order.receivedDate ?? "",
			order.note ?? "",
		]);
		downloadCsv(
			`pedidos-${new Date().toISOString().slice(0, 10)}.csv`,
			toCsv([header, ...rows]),
		);
	};

	const columns = useMemo(
		() =>
			buildPurchaseOrderColumns({
				onEdit: (order) => {
					setEditingOrder(order);
					setFormSessionId((id) => id + 1);
					setFormOpen(true);
				},
				onReceive: setOrderToReceive,
				onCancel: (order) => cancelPurchaseOrder(order.id),
				onRemove: (order) => removePurchaseOrder(order.id),
				isPending,
			}),
		[cancelPurchaseOrder, removePurchaseOrder, isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={purchaseOrders}
				searchPlaceholder="Buscar por proveedor o nota..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay pedidos registrados."
				toolbarActions={
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleExportCsv}
							disabled={purchaseOrders.length === 0}
						>
							<Download className="size-4" />
							Exportar CSV
						</Button>
						<PermissionGuard module="pedidos" action="crear">
							<Button
								type="button"
								size="sm"
								disabled={isPending}
								onClick={() => {
									setEditingOrder(null);
									setFormSessionId((id) => id + 1);
									setFormOpen(true);
								}}
							>
								<Plus className="size-4" />
								Nuevo pedido
							</Button>
						</PermissionGuard>
					</div>
				}
			/>

			<PurchaseOrderFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				order={editingOrder}
				isPending={isPending}
				onSubmit={(values) => {
					if (editingOrder) {
						updatePurchaseOrder(editingOrder.id, values);
					} else {
						addPurchaseOrder(values);
					}
				}}
			/>

			<PurchaseOrderReceiveDialog
				order={orderToReceive}
				onOpenChange={(open) => !open && setOrderToReceive(null)}
				isPending={isPending}
				onConfirm={(id, values) => {
					receivePurchaseOrder(id, values);
					setOrderToReceive(null);
				}}
			/>
		</div>
	);
}
