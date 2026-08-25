"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { Debtor, DebtorMovement, DebtorWithMovements } from "@/types";
import { registerDebtorPaymentAction } from "../debtor-actions";

type DebtorsAction = { type: "payment"; debtorId: string; amount: number };

function debtorsReducer<T extends Debtor>(
	state: T[],
	action: DebtorsAction,
): T[] {
	switch (action.type) {
		case "payment":
			return state.map((debtor) =>
				debtor.id === action.debtorId
					? { ...debtor, balance: Math.max(0, debtor.balance - action.amount) }
					: debtor,
			);
	}
}

/**
 * Controlador del listado de deudores (`/cierre-caja/deudores`): registrar un abono actualiza el
 * balance al instante (`useOptimistic`, mismo patrón que `useContactsController`) mientras la
 * mutación real corre contra la base de datos. Acepta `DebtorSummary` (con `lastActivityDate`)
 * además de `Debtor` — la mutación optimista solo toca `balance`.
 */
export function useDebtorsController<T extends Debtor>(initialDebtors: T[]) {
	const [isPending, startTransition] = useTransition();
	const [debtors, applyOptimistic] = useOptimistic(
		initialDebtors,
		debtorsReducer<T>,
	);

	const registerPayment = (
		debtorId: string,
		amount: number,
		date: string,
		note?: string,
	) => {
		startTransition(async () => {
			applyOptimistic({ type: "payment", debtorId, amount });
			await toast
				.promise(
					(async () => {
						const result = await registerDebtorPaymentAction({
							debtorId,
							amount,
							date,
							note,
						});
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando abono...",
						success: "Abono registrado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar el abono.",
					},
				)
				.catch(() => {});
		});
	};

	return { debtors, registerPayment, isPending };
}

type DebtorDetailAction = {
	type: "payment";
	amount: number;
	movement: DebtorMovement;
};

function debtorDetailReducer(
	state: DebtorWithMovements,
	action: DebtorDetailAction,
): DebtorWithMovements {
	switch (action.type) {
		case "payment":
			return {
				...state,
				balance: Math.max(0, state.balance - action.amount),
				movements: [action.movement, ...state.movements],
			};
	}
}

/** Controlador del detalle de un deudor (`/cierre-caja/deudores/[id]`): registrar un abono desde
 * ahí agrega el movimiento a la lista y ajusta el balance al instante. */
export function useDebtorDetailController(initialDebtor: DebtorWithMovements) {
	const [isPending, startTransition] = useTransition();
	const [debtor, applyOptimistic] = useOptimistic(
		initialDebtor,
		debtorDetailReducer,
	);

	const registerPayment = (amount: number, date: string, note?: string) => {
		startTransition(async () => {
			applyOptimistic({
				type: "payment",
				amount,
				movement: {
					id: crypto.randomUUID(),
					debtorId: debtor.id,
					type: "abono",
					amount,
					date,
					note,
					createdAt: new Date().toISOString(),
					createdBy: "",
				},
			});
			await toast
				.promise(
					(async () => {
						const result = await registerDebtorPaymentAction({
							debtorId: debtor.id,
							amount,
							date,
							note,
						});
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando abono...",
						success: "Abono registrado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar el abono.",
					},
				)
				.catch(() => {});
		});
	};

	return { debtor, registerPayment, isPending };
}
