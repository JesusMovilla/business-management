"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { Expense } from "@/types";
import {
	createExpenseAction,
	updateExpenseAction,
	voidExpenseAction,
} from "../actions";
import type { ExpenseFormValues } from "../components/expense-form-schema";

type ExpenseOptimisticAction =
	| { type: "add"; expense: Expense }
	| { type: "update"; id: string; patch: ExpenseFormValues }
	| { type: "void"; id: string; reason: string };

function expensesReducer(
	state: Expense[],
	action: ExpenseOptimisticAction,
): Expense[] {
	switch (action.type) {
		case "add":
			return [...state, action.expense];
		case "update":
			return state.map((expense) =>
				expense.id === action.id ? { ...expense, ...action.patch } : expense,
			);
		case "void":
			return state.map((expense) =>
				expense.id === action.id
					? { ...expense, status: "anulado", voidReason: action.reason }
					: expense,
			);
	}
}

/**
 * Controlador del módulo Gastos: envuelve las Server Actions con `useOptimistic`, mismo patrón
 * que `useContactsController` en Contactos. No hay "remove" — los gastos se anulan
 * (`voidExpense`), nunca se borran (ver docs/DECISIONS.md).
 */
export function useExpensesController(initialExpenses: Expense[]) {
	const [isPending, startTransition] = useTransition();
	const [expenses, applyOptimistic] = useOptimistic(
		initialExpenses,
		expensesReducer,
	);

	const addExpense = (values: ExpenseFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				expense: {
					...values,
					id: crypto.randomUUID(),
					createdBy: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			});
			await toast
				.promise(
					(async () => {
						const result = await createExpenseAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando gasto...",
						success: "Gasto registrado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar el gasto.",
					},
				)
				.catch(() => {});
		});
	};

	const updateExpense = (id: string, patch: ExpenseFormValues) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", id, patch });
			await toast
				.promise(
					(async () => {
						const result = await updateExpenseAction(id, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando gasto...",
						success: "Gasto actualizado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el gasto.",
					},
				)
				.catch(() => {});
		});
	};

	const voidExpense = (id: string, reason: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "void", id, reason });
			await toast
				.promise(
					(async () => {
						const result = await voidExpenseAction(id, reason);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Anulando gasto...",
						success: "Gasto anulado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo anular el gasto.",
					},
				)
				.catch(() => {});
		});
	};

	return { expenses, addExpense, updateExpense, voidExpense, isPending };
}
