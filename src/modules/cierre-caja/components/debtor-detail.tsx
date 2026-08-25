"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { DebtorWithMovements } from "@/types";
import { useDebtorDetailController } from "../hooks/use-debtors";
import { DebtorMovementsListCard } from "./debtor-movements-list-card";
import { DebtorPaymentDialog } from "./debtor-payment-dialog";

interface DebtorDetailProps {
	initialDebtor: DebtorWithMovements;
}

/** Detalle de un deudor (`/cierre-caja/deudores/[id]`): balance actual, botón para registrar un
 * abono y el historial completo de movimientos. */
export function DebtorDetail({ initialDebtor }: DebtorDetailProps) {
	const { debtor, registerPayment, isPending } =
		useDebtorDetailController(initialDebtor);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={debtor.name}
				backLabel="Volver a deudores"
				backHref="/cierre-caja/deudores"
				badge={
					debtor.balance > 0 ? (
						<Badge className="bg-(--balance-shortage-bg) text-(--balance-shortage-fg)">
							Debe {formatCurrency(debtor.balance)}
						</Badge>
					) : (
						<Badge className="bg-(--balance-ok-bg) text-(--balance-ok-fg)">
							Al día
						</Badge>
					)
				}
				actions={
					<Button
						type="button"
						disabled={debtor.balance <= 0 || isPending}
						onClick={() => setPaymentDialogOpen(true)}
					>
						Registrar abono
					</Button>
				}
			/>

			<DebtorMovementsListCard movements={debtor.movements} />

			<DebtorPaymentDialog
				debtor={paymentDialogOpen ? debtor : null}
				onOpenChange={setPaymentDialogOpen}
				isPending={isPending}
				onConfirm={(amount, date, note) => {
					registerPayment(amount, date, note);
					setPaymentDialogOpen(false);
				}}
			/>
		</div>
	);
}
