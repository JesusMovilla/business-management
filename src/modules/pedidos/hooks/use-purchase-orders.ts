"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { PurchaseOrder } from "@/types";
import {
	cancelPurchaseOrderAction,
	createPurchaseOrderAction,
	receivePurchaseOrderAction,
	removePurchaseOrderAction,
	updatePurchaseOrderAction,
} from "../actions";
import type {
	PurchaseOrderFormValues,
	ReceivePurchaseOrderValues,
} from "../components/purchase-order-form-schema";

type PurchaseOrderOptimisticAction =
	| { type: "add"; order: PurchaseOrder }
	| { type: "update"; id: string; patch: PurchaseOrderFormValues }
	| { type: "cancel"; id: string }
	| {
			type: "receive";
			id: string;
			receivedDate: string;
	  }
	| { type: "remove"; id: string };

function ordersReducer(
	state: PurchaseOrder[],
	action: PurchaseOrderOptimisticAction,
): PurchaseOrder[] {
	switch (action.type) {
		case "add":
			return [...state, action.order];
		case "update":
			return state.map((order) =>
				order.id === action.id
					? {
							...order,
							supplier: action.patch.supplier,
							orderDate: action.patch.orderDate,
							note: action.patch.note,
							lines: action.patch.lines.map((line, index) => ({
								id: order.lines[index]?.id ?? `optimistic-${index}`,
								...line,
							})),
						}
					: order,
			);
		case "cancel":
			return state.map((order) =>
				order.id === action.id ? { ...order, status: "cancelado" } : order,
			);
		case "receive":
			return state.map((order) =>
				order.id === action.id
					? {
							...order,
							status: "recibido",
							receivedDate: action.receivedDate,
						}
					: order,
			);
		case "remove":
			return state.filter((order) => order.id !== action.id);
	}
}

/** Controlador del módulo Pedidos: envuelve las Server Actions con `useOptimistic`, mismo patrón que Gastos. */
export function usePurchaseOrdersController(initialOrders: PurchaseOrder[]) {
	const [isPending, startTransition] = useTransition();
	const [purchaseOrders, applyOptimistic] = useOptimistic(
		initialOrders,
		ordersReducer,
	);

	const addPurchaseOrder = (values: PurchaseOrderFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				order: {
					...values,
					id: crypto.randomUUID(),
					status: "borrador",
					lines: values.lines.map((line, index) => ({
						id: `optimistic-${index}`,
						...line,
					})),
					createdBy: "",
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			});
			await toast
				.promise(
					(async () => {
						const result = await createPurchaseOrderAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Creando pedido...",
						success: "Pedido creado en borrador.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo crear el pedido.",
					},
				)
				.catch(() => {});
		});
	};

	const updatePurchaseOrder = (id: string, patch: PurchaseOrderFormValues) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", id, patch });
			await toast
				.promise(
					(async () => {
						const result = await updatePurchaseOrderAction(id, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando pedido...",
						success: "Pedido actualizado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el pedido.",
					},
				)
				.catch(() => {});
		});
	};

	const cancelPurchaseOrder = (id: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "cancel", id });
			await toast
				.promise(
					(async () => {
						const result = await cancelPurchaseOrderAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Cancelando pedido...",
						success: "Pedido cancelado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo cancelar el pedido.",
					},
				)
				.catch(() => {});
		});
	};

	const receivePurchaseOrder = (
		id: string,
		values: ReceivePurchaseOrderValues,
	) => {
		startTransition(async () => {
			applyOptimistic({
				type: "receive",
				id,
				receivedDate: values.receivedDate,
			});
			await toast
				.promise(
					(async () => {
						const result = await receivePurchaseOrderAction(id, values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Confirmando recepción...",
						success:
							"Pedido recibido: se actualizó el inventario y se registró el gasto.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo confirmar la recepción.",
					},
				)
				.catch(() => {});
		});
	};

	const removePurchaseOrder = (id: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "remove", id });
			await toast
				.promise(
					(async () => {
						const result = await removePurchaseOrderAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Eliminando pedido...",
						success: "Pedido eliminado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo eliminar el pedido.",
					},
				)
				.catch(() => {});
		});
	};

	return {
		purchaseOrders,
		addPurchaseOrder,
		updatePurchaseOrder,
		cancelPurchaseOrder,
		receivePurchaseOrder,
		removePurchaseOrder,
		isPending,
	};
}
