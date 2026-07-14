"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { InvestmentGroup } from "@/types";
import {
	createInvestmentGroupAction,
	removeInvestmentGroupAction,
	updateInvestmentGroupAction,
} from "../actions";
import type { InvestmentGroupFormValues } from "../components/investment-form-schema";

type GroupOptimisticAction =
	| { type: "add"; group: InvestmentGroup }
	| { type: "update"; id: string; patch: InvestmentGroupFormValues }
	| { type: "remove"; id: string };

function groupsReducer(
	state: InvestmentGroup[],
	action: GroupOptimisticAction,
): InvestmentGroup[] {
	switch (action.type) {
		case "add":
			return [...state, action.group];
		case "update":
			return state.map((group) =>
				group.id === action.id ? { ...group, ...action.patch } : group,
			);
		case "remove":
			return state.filter((group) => group.id !== action.id);
	}
}

export function useInvestmentGroupsController(
	initialGroups: InvestmentGroup[],
) {
	const [isPending, startTransition] = useTransition();
	const [groups, applyOptimistic] = useOptimistic(initialGroups, groupsReducer);

	const addGroup = (values: InvestmentGroupFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				group: { ...values, id: crypto.randomUUID() },
			});
			await toast
				.promise(
					(async () => {
						const result = await createInvestmentGroupAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Creando grupo...",
						success: "Grupo creado.",
						error: (err) =>
							err instanceof Error ? err.message : "No se pudo crear el grupo.",
					},
				)
				.catch(() => {});
		});
	};

	const updateGroup = (id: string, patch: InvestmentGroupFormValues) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", id, patch });
			await toast
				.promise(
					(async () => {
						const result = await updateInvestmentGroupAction(id, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando grupo...",
						success: "Grupo actualizado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el grupo.",
					},
				)
				.catch(() => {});
		});
	};

	const removeGroup = (id: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "remove", id });
			await toast
				.promise(
					(async () => {
						const result = await removeInvestmentGroupAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Eliminando grupo...",
						success: "Grupo eliminado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo eliminar el grupo.",
					},
				)
				.catch(() => {});
		});
	};

	return { groups, addGroup, updateGroup, removeGroup, isPending };
}
