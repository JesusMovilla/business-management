"use client";

import { useOptimistic, useTransition } from "react";
import type { ProductWithQuantity } from "@/data/repositories/product-repository";
import { toast } from "@/lib/toast";
import type {
	CashClosingItem,
	CashClosingSale,
	CashClosingWithItems,
} from "@/types";
import {
	addDraftSaleAction,
	cancelDraftAction,
	finalizeCashClosingAction,
	removeDraftSaleItemAction,
	revertCashClosingAction,
	startDraftAction,
	updateCashClosingAction,
	updateDraftDateAction,
	updateDraftItemQuantityAction,
} from "../actions";

export interface CashClosingPayload {
	date: string;
	items: { productId: string; quantitySold: number }[];
	actualCash: number;
	reason?: string;
}

function assertSuccess(
	result: { success: true } | { success: false; error: string },
	fallback: string,
): void {
	if (!result.success) throw new Error(result.error || fallback);
}

async function updateCashClosing(
	id: string,
	payload: CashClosingPayload,
): Promise<void> {
	const result = await updateCashClosingAction({ id, ...payload });
	assertSuccess(result, "No se pudo actualizar el cierre.");
}

async function revertCashClosing(id: string, reason: string): Promise<void> {
	const result = await revertCashClosingAction(id, reason);
	assertSuccess(result, "No se pudo revertir el cierre.");
}

/**
 * Envuelve las Server Actions de edición/reversión de un cierre ya finalizado (exclusivo Admin).
 * No hay estado optimista que mantener: es un formulario de un solo registro que simplemente
 * refresca — el componente que llama a estos métodos es responsable de `toast.promise` y de la
 * navegación/callback tras el éxito.
 */
export function useCashClosingMutations() {
	return { updateCashClosing, revertCashClosing };
}

type DraftItemAction =
	| { type: "add"; items: CashClosingItem[] }
	| { type: "remove"; itemId: string }
	| { type: "updateQuantity"; itemId: string; quantitySold: number };

function draftItemsReducer(
	state: CashClosingItem[],
	action: DraftItemAction,
): CashClosingItem[] {
	switch (action.type) {
		case "add":
			return [...state, ...action.items];
		case "remove":
			return state.filter((item) => item.id !== action.itemId);
		case "updateQuantity":
			return state.map((item) =>
				item.id === action.itemId
					? { ...item, quantitySold: action.quantitySold }
					: item,
			);
	}
}

type DraftSaleAction =
	| { type: "add"; sale: CashClosingSale }
	| { type: "remove"; saleId: string };

function draftSalesReducer(
	state: CashClosingSale[],
	action: DraftSaleAction,
): CashClosingSale[] {
	switch (action.type) {
		case "add":
			return [...state, action.sale];
		case "remove":
			return state.filter((sale) => sale.id !== action.saleId);
	}
}

/**
 * Controlador del borrador de cierre en curso: cada venta (uno o más productos, con su propio
 * método de pago y observación opcional, agrupados con un `saleId` compartido) se agrega/edita/
 * quita con `useOptimistic` (mismo patrón que Pedidos, `usePurchaseOrdersController`) porque ocurre
 * muchas veces a lo largo del día y debe sentirse instantáneo. Items y ventas se mantienen en dos
 * listas optimistas separadas, actualizadas juntas dentro de la misma transición para no
 * desincronizarse. Finalizar/cancelar el borrador navegan a otra página al terminar, así que no
 * necesitan estado optimista — ver `finalizeCashClosingDraft`/`cancelCashClosingDraft` más abajo.
 */
export function useCashClosingDraftController(
	draft: CashClosingWithItems,
	products: ProductWithQuantity[],
) {
	const [isPending, startTransition] = useTransition();
	const [items, applyItemsOptimistic] = useOptimistic(
		draft.items,
		draftItemsReducer,
	);
	const [sales, applySalesOptimistic] = useOptimistic(
		draft.sales,
		draftSalesReducer,
	);

	const addSale = (
		saleItems: { productId: string; quantitySold: number }[],
		paymentMethod: string,
		note?: string,
	) => {
		const resolved = saleItems
			.map((entry) => {
				const product = products.find((p) => p.id === entry.productId);
				return product ? { entry, product } : null;
			})
			.filter(
				(resolvedEntry): resolvedEntry is NonNullable<typeof resolvedEntry> =>
					resolvedEntry !== null,
			);
		if (resolved.length === 0) return;

		const saleId = crypto.randomUUID();
		startTransition(async () => {
			applySalesOptimistic({
				type: "add",
				sale: {
					id: saleId,
					cashClosingId: draft.id,
					paymentMethod,
					note,
					createdAt: new Date().toISOString(),
					createdBy: "",
				},
			});
			applyItemsOptimistic({
				type: "add",
				items: resolved.map(({ entry, product }) => ({
					id: crypto.randomUUID(),
					cashClosingId: draft.id,
					productId: entry.productId,
					quantitySold: entry.quantitySold,
					unitPrice: product.pricing.retailPrice,
					unitCost: product.pricing.cost,
					saleId,
				})),
			});
			await toast
				.promise(
					(async () => {
						const result = await addDraftSaleAction({
							draftId: draft.id,
							paymentMethod,
							note,
							items: saleItems,
						});
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Registrando venta...",
						success: "Venta registrada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo registrar la venta.",
					},
				)
				.catch(() => {});
		});
	};

	const updateSaleItemQuantity = (itemId: string, quantitySold: number) => {
		startTransition(async () => {
			applyItemsOptimistic({ type: "updateQuantity", itemId, quantitySold });
			await toast
				.promise(
					(async () => {
						const result = await updateDraftItemQuantityAction({
							draftId: draft.id,
							itemId,
							quantitySold,
						});
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando cantidad...",
						success: "Cantidad actualizada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar la cantidad.",
					},
				)
				.catch(() => {});
		});
	};

	const removeSale = (itemId: string) => {
		const item = items.find((existing) => existing.id === itemId);
		const isLastItemOfSale =
			item?.saleId &&
			items.filter((existing) => existing.saleId === item.saleId).length === 1;

		startTransition(async () => {
			applyItemsOptimistic({ type: "remove", itemId });
			if (isLastItemOfSale && item?.saleId) {
				applySalesOptimistic({ type: "remove", saleId: item.saleId });
			}
			await toast
				.promise(
					(async () => {
						const result = await removeDraftSaleItemAction({
							draftId: draft.id,
							itemId,
						});
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Quitando venta...",
						success: "Venta quitada.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo quitar la venta.",
					},
				)
				.catch(() => {});
		});
	};

	return {
		items,
		sales,
		addSale,
		updateSaleItemQuantity,
		removeSale,
		isPending,
	};
}

/** Abre el borrador en curso (o reusa el ya abierto) y devuelve su id — lanza si algo falla. */
export async function startCashClosingDraft(): Promise<string> {
	const result = await startDraftAction();
	assertSuccess(result, "No se pudo iniciar el cierre.");
	if (!result.id) throw new Error("No se pudo iniciar el cierre.");
	return result.id;
}

/** Cambia la fecha del cierre en curso — lanza si algo falla. */
export async function updateCashClosingDraftDate(
	draftId: string,
	date: string,
): Promise<void> {
	const result = await updateDraftDateAction({ draftId, date });
	assertSuccess(result, "No se pudo actualizar la fecha.");
}

/** Finaliza el borrador y devuelve el id del cierre generado — lanza si algo falla. */
export async function finalizeCashClosingDraft(
	draftId: string,
	actualCash: number,
	reason?: string,
): Promise<string> {
	const result = await finalizeCashClosingAction({
		draftId,
		actualCash,
		reason,
	});
	assertSuccess(result, "No se pudo finalizar el cierre.");
	if (!result.id) throw new Error("No se pudo finalizar el cierre.");
	return result.id;
}

/** Abandona el borrador en curso sin generar cierre. */
export async function cancelCashClosingDraft(draftId: string): Promise<void> {
	const result = await cancelDraftAction(draftId);
	assertSuccess(result, "No se pudo cancelar el borrador.");
}
