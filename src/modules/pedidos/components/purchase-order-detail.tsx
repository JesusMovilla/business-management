"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import {
	formatCurrency,
	formatDateTime,
	formatProductLabel,
} from "@/lib/format";
import { useIsAdmin } from "@/lib/rbac/use-permission";
import { toast } from "@/lib/toast";
import type { Expense, PurchaseOrder } from "@/types";
import {
	purchaseOrderLineUnitCost,
	purchaseOrderLineUnits,
	purchaseOrderTotal,
} from "@/types";
import { usePurchaseOrderDetailMutations } from "../hooks/use-purchase-order-detail";
import { PurchaseOrderRevertDialog } from "./purchase-order-revert-dialog";
import {
	PURCHASE_ORDER_STATUS_BADGE_VARIANT,
	PURCHASE_ORDER_STATUS_LABELS,
} from "./purchase-order-table-columns";

const PURCHASE_MODE_LABELS: Record<
	PurchaseOrder["lines"][number]["purchaseMode"],
	string
> = {
	paquete: "Paquete",
	unidad: "Unidad",
};

interface PurchaseOrderDetailProps {
	order: PurchaseOrder;
	products: ProductWithQuantity[];
	expense: Expense | null;
	createdByName: string;
	reversedByName?: string;
}

export function PurchaseOrderDetail({
	order,
	products,
	expense,
	createdByName,
	reversedByName,
}: PurchaseOrderDetailProps) {
	const router = useRouter();
	const isAdmin = useIsAdmin();
	const { revertPurchaseOrder } = usePurchaseOrderDetailMutations();
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [isReverting, setIsReverting] = useState(false);
	const isReceived = order.status === "recibido";
	const isReverted = order.status === "revertido";

	const productName = (productId: string) => {
		const product = products.find((p) => p.id === productId);
		return product ? formatProductLabel(product) : "Producto eliminado";
	};

	const handleConfirmRevert = async (reason: string) => {
		setIsReverting(true);
		try {
			await toast.promise(revertPurchaseOrder(order.id, reason), {
				loading: "Revirtiendo recepción...",
				success: "Recepción revertida correctamente.",
				error: (err) =>
					err instanceof Error
						? err.message
						: "No se pudo revertir la recepción.",
			});
			setRevertDialogOpen(false);
			router.refresh();
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsReverting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Pedido"
				description={order.supplier}
				badge={
					<Badge variant={PURCHASE_ORDER_STATUS_BADGE_VARIANT[order.status]}>
						{PURCHASE_ORDER_STATUS_LABELS[order.status]}
					</Badge>
				}
				backHref="/pedidos"
				actions={
					isAdmin &&
					isReceived && (
						<Button
							type="button"
							variant="outline"
							onClick={() => setRevertDialogOpen(true)}
						>
							Revertir
						</Button>
					)
				}
			/>

			{isReverted && (
				<Card className="border-destructive/40">
					<CardContent className="flex flex-col gap-1 pt-6 text-sm">
						<span className="font-medium">
							Revertido{" "}
							{order.reversedAt &&
								`por ${reversedByName ?? "—"} · ${formatDateTime(order.reversedAt)}`}
						</span>
						{order.reversalReason && (
							<span className="text-muted-foreground">
								Motivo: {order.reversalReason}
							</span>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Datos del pedido</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
					<Info label="Proveedor" value={order.supplier} />
					<Info label="Fecha del pedido" value={order.orderDate} />
					<Info label="Fecha de recepción" value={order.receivedDate ?? "—"} />
					<Info
						label="Total"
						value={formatCurrency(purchaseOrderTotal(order))}
					/>
					<Info label="Nota" value={order.note || "—"} />
					<Info
						label="Creado por"
						value={`${createdByName} · ${formatDateTime(order.createdAt)}`}
					/>
					{expense && (
						<Info
							label="Gasto asociado"
							value={
								<span className="flex items-center gap-2">
									{formatCurrency(expense.amount)}
									{expense.status === "anulado" && (
										<Badge variant="destructive">Anulado</Badge>
									)}
								</span>
							}
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Productos</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Producto</TableHead>
								<TableHead>Modo</TableHead>
								<TableHead>Cantidad</TableHead>
								<TableHead>Unidades</TableHead>
								<TableHead>Costo unitario</TableHead>
								<TableHead>Subtotal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{order.lines.map((line) => (
								<TableRow key={line.id}>
									<TableCell>{productName(line.productId)}</TableCell>
									<TableCell>
										{PURCHASE_MODE_LABELS[line.purchaseMode]}
									</TableCell>
									<TableCell>{line.quantity}</TableCell>
									<TableCell>{purchaseOrderLineUnits(line)}</TableCell>
									<TableCell>
										{formatCurrency(purchaseOrderLineUnitCost(line))}
									</TableCell>
									<TableCell>
										{formatCurrency(line.quantity * line.unitCost)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<PurchaseOrderRevertDialog
				open={revertDialogOpen}
				onOpenChange={setRevertDialogOpen}
				onConfirm={handleConfirmRevert}
				isPending={isReverting}
			/>
		</div>
	);
}

function Info({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
