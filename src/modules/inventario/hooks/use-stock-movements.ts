"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { MermaReason, StockMovement } from "@/types";
import { createManualStockMovementAction } from "../actions";
import {
	type MovementAuthor,
	useInventoryContext,
} from "../inventory-provider";

export function useAllMovements(): StockMovement[] {
	const { state } = useInventoryContext();
	return state.movements;
}

export function useMovementAuthors(): MovementAuthor[] {
	const { users } = useInventoryContext();
	return users;
}

export function useProductMovements(productId: string): StockMovement[] {
	const movements = useAllMovements();
	return useMemo(
		() =>
			movements
				.filter((movement) => movement.productId === productId)
				.sort((a, b) => b.date.localeCompare(a.date)),
		[movements, productId],
	);
}

async function applyManualMovement(
	applyOptimistic: (action: {
		type: "add-movement";
		movement: StockMovement;
	}) => void,
	startTransition: (callback: () => void) => void,
	userId: string,
	input: {
		productId: string;
		type: StockMovement["type"];
		delta: number;
		reason?: MermaReason;
		note?: string;
	},
): Promise<void> {
	const result = await createManualStockMovementAction(input);
	if (!result.success) throw new Error(result.error);
	startTransition(() => {
		applyOptimistic({
			type: "add-movement",
			movement: {
				...input,
				id: crypto.randomUUID(),
				date: new Date().toISOString(),
				userId,
			},
		});
	});
}

export function useStockMovementMutations() {
	const { applyOptimistic, startTransition } = useInventoryContext();
	const userId = useAuthStore((state) => state.currentUser?.id) ?? "";

	const registerEntrada = (
		productId: string,
		quantity: number,
		note?: string,
	) =>
		applyManualMovement(applyOptimistic, startTransition, userId, {
			productId,
			type: "entrada",
			delta: quantity,
			note,
		});

	const registerVenta = (productId: string, quantity: number, note?: string) =>
		applyManualMovement(applyOptimistic, startTransition, userId, {
			productId,
			type: "venta",
			delta: -quantity,
			note,
		});

	const registerMerma = (
		productId: string,
		quantity: number,
		reason: MermaReason,
		note?: string,
	) =>
		applyManualMovement(applyOptimistic, startTransition, userId, {
			productId,
			type: "merma",
			delta: -quantity,
			reason,
			note,
		});

	const registerAjuste = (productId: string, delta: number, note: string) =>
		applyManualMovement(applyOptimistic, startTransition, userId, {
			productId,
			type: "ajuste",
			delta,
			note,
		});

	return {
		registerEntrada,
		registerVenta,
		registerMerma,
		registerAjuste,
	};
}
