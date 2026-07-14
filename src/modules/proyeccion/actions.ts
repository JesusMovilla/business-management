"use server";

import { revalidatePath } from "next/cache";
import { profitPayoutRepository } from "@/data/repositories/profit-payout-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/rbac/require-permission";
import { profitPayoutFormSchema } from "./components/profit-payout-form-schema";

export type ProyeccionActionResult =
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

function revalidateProyeccion() {
	revalidatePath("/proyeccion");
}

export async function createProfitPayoutAction(
	input: unknown,
): Promise<ProyeccionActionResult> {
	const authz = await checkPermission("proyeccion", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = profitPayoutFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await profitPayoutRepository.create(
		{ ...parsed.data, status: "activo" },
		userId,
	);
	revalidateProyeccion();
	return { success: true };
}

export async function voidProfitPayoutAction(
	id: string,
	reason: string,
): Promise<ProyeccionActionResult> {
	const authz = await checkPermission("proyeccion", "eliminar");
	if (authz) return { success: false, error: authz.error };

	if (!reason.trim()) {
		return {
			success: false,
			error: "Indica un motivo para anular el pago.",
		};
	}
	const existing = await profitPayoutRepository.getById(id);
	if (!existing) return { success: false, error: "El pago no existe." };
	if (existing.status === "anulado") {
		return { success: false, error: "El pago ya está anulado." };
	}

	const userId = await requireSessionUserId();
	await profitPayoutRepository.void(id, reason.trim(), userId);
	revalidateProyeccion();
	return { success: true };
}
