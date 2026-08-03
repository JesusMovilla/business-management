"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CurrencyInput } from "@/components/forms/currency-input";
import { PageHeader } from "@/components/layout/page-header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { formatCurrency } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { CashClosingWithItems } from "@/types";
import {
	cancelCashClosingDraft,
	finalizeCashClosingDraft,
	useCashClosingDraftController,
} from "../hooks/use-cash-closings";
import { getBalanceStatus } from "../lib/balance-status";
import { CashClosingProductSummaryCard } from "./cash-closing-product-summary-card";
import { CashClosingReasonDialog } from "./cash-closing-reason-dialog";
import { CashClosingRegisterSaleCard } from "./cash-closing-register-sale-card";
import { CashClosingSalesListCard } from "./cash-closing-sales-list-card";
import { CashClosingStatusBadge } from "./cash-closing-status-badge";

interface CashClosingDraftViewProps {
	draft: CashClosingWithItems;
	products: ProductWithQuantity[];
}

/**
 * Cierre de caja en curso: el vendedor registra cada venta (uno o más productos, con su método de
 * pago y una observación opcional) a medida que ocurre, en vez de cargar todo de una vez al final
 * del día. Compone tres secciones independientes — registrar venta, ventas registradas (agrupadas
 * por venta) y detalle por producto — y coordina la finalización/cancelación del borrador. El
 * inventario recién se descuenta al presionar "Finalizar cierre" — ver
 * `../hooks/use-cash-closings.ts` y `docs/DECISIONS.md`.
 */
export function CashClosingDraftView({
	draft,
	products,
}: CashClosingDraftViewProps) {
	const router = useRouter();
	const {
		items,
		sales,
		addSale,
		updateSaleItemQuantity,
		removeSale,
		isPending,
	} = useCashClosingDraftController(draft, products);
	const [actualCash, setActualCash] = useState<number | null>(null);
	const [reason, setReason] = useState("");
	const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [isFinalizing, setIsFinalizing] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);

	const expectedIncome = items.reduce(
		(total, item) => total + item.quantitySold * item.unitPrice,
		0,
	);
	const difference = actualCash === null ? 0 : actualCash - expectedIncome;
	const hasDifference = actualCash !== null && difference !== 0;
	const canFinalize = items.length > 0 && actualCash !== null;

	const doFinalize = async () => {
		if (actualCash === null) return;
		setIsFinalizing(true);
		try {
			const id = await toast.promise(
				finalizeCashClosingDraft(
					draft.id,
					actualCash,
					reason.trim() || undefined,
				),
				{
					loading: "Finalizando cierre...",
					success: "Cierre finalizado correctamente.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo finalizar el cierre.",
				},
			);
			router.push(`/cierre-caja/${id}`);
		} catch {
			// El toast ya mostró el error; el usuario se queda para reintentar.
		} finally {
			setIsFinalizing(false);
		}
	};

	const handleFinalizeClick = () => {
		if (!canFinalize) return;
		if (hasDifference) {
			setReasonDialogOpen(true);
			return;
		}
		void doFinalize();
	};

	const handleConfirmReason = () => {
		if (!reason.trim()) return;
		setReasonDialogOpen(false);
		void doFinalize();
	};

	const handleConfirmCancel = async () => {
		setIsCancelling(true);
		try {
			await toast.promise(cancelCashClosingDraft(draft.id), {
				loading: "Cancelando borrador...",
				success: "Borrador cancelado.",
				error: (err) =>
					err instanceof Error
						? err.message
						: "No se pudo cancelar el borrador.",
			});
			setCancelDialogOpen(false);
			router.push("/cierre-caja");
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsCancelling(false);
		}
	};

	return (
		<>
			<PageHeader
				title="Cierre de caja en curso"
				description="Registra cada venta a medida que ocurre."
				backLabel="Volver a cierre de caja"
				backHref="/cierre-caja"
				actions={
					<Button
						type="button"
						variant="outline"
						onClick={() => setCancelDialogOpen(true)}
					>
						Cancelar cierre
					</Button>
				}
			/>

			<div className="mt-6 flex flex-col gap-6">
				<CashClosingRegisterSaleCard
					draftId={draft.id}
					initialDate={draft.date}
					products={products}
					items={items}
					addSale={addSale}
					isPending={isPending}
				/>

				<CashClosingSalesListCard
					items={items}
					sales={sales}
					products={products}
					updateSaleItemQuantity={updateSaleItemQuantity}
					removeSale={removeSale}
				/>

				<CashClosingProductSummaryCard
					items={items}
					products={products}
					expectedIncome={expectedIncome}
				/>

				<Card>
					<CardHeader>
						<CardTitle>Finalizar cierre</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="actual-cash">Dinero real contado</Label>
							<CurrencyInput
								id="actual-cash"
								value={actualCash}
								onValueChange={setActualCash}
								placeholder="$ 0"
							/>
						</div>
						{actualCash !== null && (
							<div className="flex flex-col gap-2">
								<Label>Diferencia</Label>
								<div className="flex items-center gap-2">
									<CashClosingStatusBadge
										status={getBalanceStatus(difference)}
									/>
									{difference !== 0 && (
										<span className="text-sm">
											{formatCurrency(Math.abs(difference))}
										</span>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button
						type="button"
						onClick={handleFinalizeClick}
						disabled={!canFinalize || isFinalizing}
					>
						Finalizar cierre
					</Button>
				</div>
			</div>

			<CashClosingReasonDialog
				open={reasonDialogOpen}
				onOpenChange={setReasonDialogOpen}
				difference={difference}
				reason={reason}
				onReasonChange={setReason}
				onCancel={() => setReasonDialogOpen(false)}
				onConfirm={handleConfirmReason}
			/>

			<AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancelar cierre en curso</AlertDialogTitle>
						<AlertDialogDescription>
							Se perderán las {items.length} venta(s) registradas hoy. Esta
							acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isCancelling}>
							Volver
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isCancelling}
							onClick={() => void handleConfirmCancel()}
						>
							Cancelar cierre
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
