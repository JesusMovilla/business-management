"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { ProfitPayout } from "@/types";
import { createProfitPayoutAction, voidProfitPayoutAction } from "../actions";
import type { ProfitPayoutFormValues } from "../components/profit-payout-form-schema";

type ProfitPayoutOptimisticAction =
	| { type: "add"; payout: ProfitPayout }
	| { type: "void"; id: string; reason: string };

function profitPayoutsReducer(
	state: ProfitPayout[],
	action: ProfitPayoutOptimisticAction,
): ProfitPayout[] {
	switch (action.type) {
		case "add":
			return [...state, action.payout];
		case "void":
			return state.map((payout) =>
				payout.id === action.id
					? { ...payout, status: "anulado", voidReason: action.reason }
					: payout,
			);
	}
}

/**
 * Controlador del módulo Proyección: envuelve las Server Actions con `useOptimistic`, mismo
 * patrón que `useInvestmentsController`. No hay "editar" ni "remove" — un pago solo se registra o
 * se anula (`voidProfitPayout`), nunca se borra ni se modifica (ver docs/DECISIONS.md).
 */
export function useProfitPayoutsController(initialPayouts: ProfitPayout[]) {
	const [isPending, startTransition] = useTransition();
	const [payouts, applyOptimistic] = useOptimistic(
		initialPayouts,
		profitPayoutsReducer,
	);

	const addPayout = (values: ProfitPayoutFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				payout: {
					...values,
					id: crypto.randomUUID(),
					status: "activo",
					createdBy: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			});
			await toast
				.promise(
					(async () => {
						const result = await createProfitPayoutAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando pago...",
						success: "Pago registrado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar el pago.",
					},
				)
				.catch(() => {});
		});
	};

	const voidPayout = (id: string, reason: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "void", id, reason });
			await toast
				.promise(
					(async () => {
						const result = await voidProfitPayoutAction(id, reason);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Anulando pago...",
						success: "Pago anulado.",
						error: (err) =>
							err instanceof Error ? err.message : "No se pudo anular el pago.",
					},
				)
				.catch(() => {});
		});
	};

	return {
		payouts,
		addPayout,
		voidPayout,
		isPending,
	};
}
