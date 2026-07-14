"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { ExpenseCategory } from "@/types";
import {
	createExpenseCategoryAction,
	removeExpenseCategoryAction,
} from "../actions";
import type { ExpenseCategoryFormValues } from "../components/expense-form-schema";

type CategoryOptimisticAction =
	| { type: "add"; category: ExpenseCategory }
	| { type: "remove"; id: string };

function categoriesReducer(
	state: ExpenseCategory[],
	action: CategoryOptimisticAction,
): ExpenseCategory[] {
	switch (action.type) {
		case "add":
			return [...state, action.category];
		case "remove":
			return state.filter((category) => category.id !== action.id);
	}
}

export function useExpenseCategoriesController(
	initialCategories: ExpenseCategory[],
) {
	const [isPending, startTransition] = useTransition();
	const [categories, applyOptimistic] = useOptimistic(
		initialCategories,
		categoriesReducer,
	);

	const addCategory = (values: ExpenseCategoryFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				category: { ...values, id: crypto.randomUUID() },
			});
			await toast
				.promise(
					(async () => {
						const result = await createExpenseCategoryAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Creando categoría...",
						success: "Categoría creada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo crear la categoría.",
					},
				)
				.catch(() => {});
		});
	};

	const removeCategory = (id: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "remove", id });
			await toast
				.promise(
					(async () => {
						const result = await removeExpenseCategoryAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Eliminando categoría...",
						success: "Categoría eliminada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo eliminar la categoría.",
					},
				)
				.catch(() => {});
		});
	};

	return { categories, addCategory, removeCategory, isPending };
}
