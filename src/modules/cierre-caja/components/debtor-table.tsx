"use client";

import type { FilterFn } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { DebtorSummary } from "@/data/repositories/debtor-repository";
import type { Debtor } from "@/types";
import { useDebtorsController } from "../hooks/use-debtors";
import { DebtorPaymentDialog } from "./debtor-payment-dialog";
import { buildDebtorColumns } from "./debtor-table-columns";

const globalFilterFn: FilterFn<DebtorSummary> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	return row.original.name.toLowerCase().includes(search);
};

interface DebtorTableProps {
	initialDebtors: DebtorSummary[];
}

/**
 * Listado de seguimiento de "quién me debe" (`/cierre-caja/deudores`): balance actual y última
 * actividad de cada deudor, con acciones para ver su historial completo o registrar un abono sin
 * salir de la tabla. Un deudor nunca se elimina de aquí — un abono total solo deja su balance en
 * 0, porque es probable que vuelva a fiar.
 */
export function DebtorTable({ initialDebtors }: DebtorTableProps) {
	const { debtors, registerPayment, isPending } =
		useDebtorsController(initialDebtors);
	const [debtorToPay, setDebtorToPay] = useState<Debtor | null>(null);

	const columns = useMemo(
		() =>
			buildDebtorColumns({
				onRegisterPayment: setDebtorToPay,
				isPending,
			}),
		[isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={debtors}
				searchPlaceholder="Buscar por nombre..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay deudores registrados."
			/>

			<DebtorPaymentDialog
				debtor={debtorToPay}
				onOpenChange={(open) => !open && setDebtorToPay(null)}
				isPending={isPending}
				onConfirm={(amount, date, note) => {
					if (!debtorToPay) return;
					registerPayment(debtorToPay.id, amount, date, note);
					setDebtorToPay(null);
				}}
			/>
		</div>
	);
}
