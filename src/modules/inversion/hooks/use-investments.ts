"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { Investment } from "@/types";
import {
	createInvestmentAction,
	updateInvestmentAction,
	voidInvestmentAction,
} from "../actions";
import type { InvestmentFormValues } from "../components/investment-form-schema";

type InvestmentOptimisticAction =
	| { type: "add"; investment: Investment }
	| { type: "update"; id: string; patch: InvestmentFormValues }
	| { type: "void"; id: string; reason: string };

function investmentsReducer(
	state: Investment[],
	action: InvestmentOptimisticAction,
): Investment[] {
	switch (action.type) {
		case "add":
			return [...state, action.investment];
		case "update":
			return state.map((investment) =>
				investment.id === action.id
					? { ...investment, ...action.patch }
					: investment,
			);
		case "void":
			return state.map((investment) =>
				investment.id === action.id
					? { ...investment, status: "anulada", voidReason: action.reason }
					: investment,
			);
	}
}

/**
 * Controlador del módulo Inversión: envuelve las Server Actions con `useOptimistic`, mismo
 * patrón que `useExpensesController` en Gastos. No hay "remove" — las inversiones se anulan
 * (`voidInvestment`), nunca se borran (ver docs/DECISIONS.md).
 */
export function useInvestmentsController(initialInvestments: Investment[]) {
	const [isPending, startTransition] = useTransition();
	const [investments, applyOptimistic] = useOptimistic(
		initialInvestments,
		investmentsReducer,
	);

	const addInvestment = (values: InvestmentFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				investment: {
					...values,
					id: crypto.randomUUID(),
					status: "activa",
					createdBy: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			});
			await toast
				.promise(
					(async () => {
						const result = await createInvestmentAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando inversión...",
						success: "Inversión registrada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar la inversión.",
					},
				)
				.catch(() => {});
		});
	};

	const updateInvestment = (id: string, patch: InvestmentFormValues) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", id, patch });
			await toast
				.promise(
					(async () => {
						const result = await updateInvestmentAction(id, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando inversión...",
						success: "Inversión actualizada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar la inversión.",
					},
				)
				.catch(() => {});
		});
	};

	const voidInvestment = (id: string, reason: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "void", id, reason });
			await toast
				.promise(
					(async () => {
						const result = await voidInvestmentAction(id, reason);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Anulando inversión...",
						success: "Inversión anulada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo anular la inversión.",
					},
				)
				.catch(() => {});
		});
	};

	return {
		investments,
		addInvestment,
		updateInvestment,
		voidInvestment,
		isPending,
	};
}
