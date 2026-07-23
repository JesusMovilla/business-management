"use server";

import { revalidatePath } from "next/cache";
import { purchaseOrderRepository } from "@/data/repositories/purchase-order-repository";
import { toActionErrorMessage } from "@/lib/action-error";
import { getCurrentSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/rbac/require-permission";
import {
	purchaseOrderFormSchema,
	receivePurchaseOrderSchema,
} from "./components/purchase-order-form-schema";

export type PurchaseOrderActionResult =
	| { success: true }
	| { success: false; error: string };

function firstIssueMessage(error: { issues: { message: string }[] }): string {
	return error.issues[0]?.message ?? "Datos inválidos.";
}

async function requireSessionUserId(): Promise<string> {
	const session = await getCurrentSession();
	if (!session?.user) throw new Error("No autenticado.");
	return session.user.id;
}

/** Cualquier cambio a un pedido puede afectar sus eventos derivados en Calendario e Inicio. */
function revalidatePedidos() {
	revalidatePath("/pedidos");
	revalidatePath("/calendario");
	revalidatePath("/inicio");
}

export async function createPurchaseOrderAction(
	input: unknown,
): Promise<PurchaseOrderActionResult & { id?: string }> {
	const authz = await checkPermission("pedidos", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = purchaseOrderFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	let id: string;
	try {
		id = await purchaseOrderRepository.create(parsed.data, userId);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo crear el pedido.",
				fk: "No se puede crear: uno de los productos seleccionados ya no existe.",
			}),
		};
	}
	revalidatePedidos();
	return { success: true, id };
}

export async function updatePurchaseOrderAction(
	id: string,
	input: unknown,
): Promise<PurchaseOrderActionResult> {
	const authz = await checkPermission("pedidos", "editar");
	if (authz) return { success: false, error: authz.error };

	const parsed = purchaseOrderFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	try {
		await purchaseOrderRepository.update(id, parsed.data);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo actualizar el pedido.",
			}),
		};
	}
	revalidatePedidos();
	return { success: true };
}

export async function cancelPurchaseOrderAction(
	id: string,
): Promise<PurchaseOrderActionResult> {
	const authz = await checkPermission("pedidos", "editar");
	if (authz) return { success: false, error: authz.error };

	try {
		await purchaseOrderRepository.cancel(id);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo cancelar el pedido.",
			}),
		};
	}
	revalidatePedidos();
	return { success: true };
}

/** Confirma la recepción — genera la entrada de inventario y el gasto asociado. */
export async function receivePurchaseOrderAction(
	id: string,
	input: unknown,
): Promise<PurchaseOrderActionResult> {
	const authz = await checkPermission("pedidos", "editar");
	if (authz) return { success: false, error: authz.error };

	const parsed = receivePurchaseOrderSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	try {
		await purchaseOrderRepository.receive(
			id,
			parsed.data.receivedDate,
			parsed.data.paymentMethod,
			userId,
		);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo confirmar la recepción.",
			}),
		};
	}
	revalidatePedidos();
	revalidatePath("/inventario", "layout");
	revalidatePath("/gastos");
	return { success: true };
}

export async function removePurchaseOrderAction(
	id: string,
): Promise<PurchaseOrderActionResult> {
	const authz = await checkPermission("pedidos", "eliminar");
	if (authz) return { success: false, error: authz.error };

	try {
		await purchaseOrderRepository.remove(id);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo eliminar el pedido.",
				fk: "No se puede eliminar: el pedido ya generó un gasto o movimiento asociado.",
			}),
		};
	}
	revalidatePedidos();
	return { success: true };
}
