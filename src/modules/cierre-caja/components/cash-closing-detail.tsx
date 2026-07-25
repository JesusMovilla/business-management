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
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useIsAdmin } from "@/lib/rbac/use-permission";
import { toast } from "@/lib/toast";
import type { CashClosingWithItems } from "@/types";
import { useCashClosingMutations } from "../hooks/use-cash-closings";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingForm } from "./cash-closing-form";
import { CashClosingRevertDialog } from "./cash-closing-revert-dialog";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingDetailProps {
	closing: CashClosingWithItems;
	products: ProductWithQuantity[];
	createdByName: string;
	updatedByName?: string;
}

export function CashClosingDetail({
	closing,
	products,
	createdByName,
	updatedByName,
}: CashClosingDetailProps) {
	const router = useRouter();
	const isAdmin = useIsAdmin();
	const { revertCashClosing } = useCashClosingMutations();
	const [isEditing, setIsEditing] = useState(false);
	const [revertDialogOpen, setRevertDialogOpen] = useState(false);
	const [isReverting, setIsReverting] = useState(false);
	const isReverted = closing.status === "revertido";

	const productName = (productId: string) =>
		products.find((product) => product.id === productId)?.name ??
		"Producto eliminado";

	const handleConfirmRevert = async (reason: string) => {
		setIsReverting(true);
		try {
			await toast.promise(revertCashClosing(closing.id, reason), {
				loading: "Revirtiendo cierre...",
				success: "Cierre revertido correctamente.",
				error: (err) =>
					err instanceof Error ? err.message : "No se pudo revertir el cierre.",
			});
			setRevertDialogOpen(false);
			router.refresh();
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsReverting(false);
		}
	};

	if (isEditing) {
		return (
			<CashClosingForm
				mode="edit"
				products={products}
				closing={closing}
				onSuccess={() => setIsEditing(false)}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Cierre de caja"
				description={closing.date}
				badge={isReverted && <Badge variant="destructive">Revertido</Badge>}
				backHref="/cierre-caja"
				actions={
					isAdmin &&
					!isReverted && (
						<>
							<Button
								type="button"
								variant="outline"
								onClick={() => setRevertDialogOpen(true)}
							>
								Revertir
							</Button>
							<Button type="button" onClick={() => setIsEditing(true)}>
								Editar
							</Button>
						</>
					)
				}
			/>

			{isReverted && (
				<Card className="border-destructive/40">
					<CardContent className="flex flex-col gap-1 pt-6 text-sm">
						<span className="font-medium">
							Revertido{" "}
							{closing.reversedAt && formatDateTime(closing.reversedAt)}
						</span>
						{closing.reversalReason && (
							<span className="text-muted-foreground">
								Motivo: {closing.reversalReason}
							</span>
						)}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Conciliación</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
					<Info
						label="Ingreso esperado"
						value={formatCurrency(closing.expectedIncome)}
					/>
					<Info
						label="Dinero real"
						value={formatCurrency(closing.actualCash)}
					/>
					<Info
						label="Diferencia"
						value={
							<div className="flex items-center gap-2">
								<CashClosingStatusBadge
									status={getBalanceStatus(closing.difference)}
								/>
								{closing.difference !== 0 && (
									<span>{formatCurrency(Math.abs(closing.difference))}</span>
								)}
							</div>
						}
					/>
					<Info label="Motivo" value={closing.reason || "—"} />
					<Info
						label="Creado por"
						value={`${createdByName} · ${formatDateTime(closing.createdAt)}`}
					/>
					{updatedByName && (
						<Info
							label="Última edición"
							value={`${updatedByName} · ${formatDateTime(closing.updatedAt)}`}
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Productos vendidos</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Producto</TableHead>
								<TableHead>Cantidad</TableHead>
								<TableHead>Precio unitario</TableHead>
								<TableHead>Subtotal</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{closing.items.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{productName(item.productId)}</TableCell>
									<TableCell>{item.quantitySold}</TableCell>
									<TableCell>{formatCurrency(item.unitPrice)}</TableCell>
									<TableCell>
										{formatCurrency(item.unitPrice * item.quantitySold)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<CashClosingRevertDialog
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
