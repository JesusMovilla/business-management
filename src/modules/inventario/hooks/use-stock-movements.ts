"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useStockMovementStore } from "@/stores/stock-movement-store";
import type { MermaReason, StockMovement } from "@/types";

export function useAllMovements(): StockMovement[] {
	return useStockMovementStore((state) => state.movements);
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

export function useProductQuantity(productId: string): number {
	const movements = useAllMovements();
	return useMemo(
		() =>
			movements
				.filter((movement) => movement.productId === productId)
				.reduce((sum, movement) => sum + movement.delta, 0),
		[movements, productId],
	);
}

export function useStockMovementMutations() {
	const addMovement = useStockMovementStore((state) => state.addMovement);
	const currentUserId = useAuthStore((state) => state.currentUser?.id);

	const registerEntrada = (
		productId: string,
		quantity: number,
		note?: string,
	) =>
		addMovement({
			productId,
			type: "entrada",
			delta: quantity,
			date: new Date().toISOString(),
			note,
			userId: currentUserId ?? "",
		});

	const registerVenta = (productId: string, quantity: number, note?: string) =>
		addMovement({
			productId,
			type: "venta",
			delta: -quantity,
			date: new Date().toISOString(),
			note,
			userId: currentUserId ?? "",
		});

	const registerMerma = (
		productId: string,
		quantity: number,
		reason: MermaReason,
		note?: string,
	) =>
		addMovement({
			productId,
			type: "merma",
			delta: -quantity,
			date: new Date().toISOString(),
			reason,
			note,
			userId: currentUserId ?? "",
		});

	const registerAjuste = (productId: string, delta: number, note: string) =>
		addMovement({
			productId,
			type: "ajuste",
			delta,
			date: new Date().toISOString(),
			note,
			userId: currentUserId ?? "",
		});

	return { registerEntrada, registerVenta, registerMerma, registerAjuste };
}
