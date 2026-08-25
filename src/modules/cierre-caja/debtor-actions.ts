"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { debtorRepository } from "@/data/repositories/debtor-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/rbac/require-permission";
import type { Debtor, DebtorWithMovements } from "@/types";

export type DebtorActionResult =
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

/** Deudores que aparecen en el selector del diálogo de asignación de diferencia — su balance
 * viaja junto para poder desambiguar dos personas con el mismo nombre. Con `query` vacío devuelve
 * los deudores existentes (para que el selector muestre algo apenas se enfoca, no solo al
 * escribir). */
export async function searchDebtorsAction(
	query: string,
): Promise<Debtor[] | { error: string }> {
	const authz = await checkPermission("cierre-caja", "ver");
	if (authz) return { error: authz.error };
	return debtorRepository.search(query.trim());
}

/** Listado completo para `/cierre-caja/deudores` — se resuelve directo desde el Server Component
 * de la página, esta acción existe para refrescos desde el cliente si se necesitan. */
export async function listDebtorsAction(): Promise<
	Debtor[] | { error: string }
> {
	const authz = await checkPermission("cierre-caja", "ver");
	if (authz) return { error: authz.error };
	return debtorRepository.listAll();
}

export async function getDebtorAction(
	id: string,
): Promise<DebtorWithMovements | null | { error: string }> {
	const authz = await checkPermission("cierre-caja", "ver");
	if (authz) return { error: authz.error };
	return debtorRepository.getById(id);
}

const registerDebtorPaymentSchema = z.object({
	debtorId: z.string().min(1),
	amount: z.coerce.number().positive("El abono debe ser mayor a 0."),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
	note: z.string().optional(),
});

/**
 * Registra un abono (pago parcial o total) de un deudor existente — nunca se permite un abono
 * mayor al balance pendiente (evita un balance negativo sin sentido de negocio). El deudor nunca
 * se borra: si el abono cubre toda la deuda, su balance simplemente queda en 0.
 */
export async function registerDebtorPaymentAction(
	input: unknown,
): Promise<DebtorActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = registerDebtorPaymentSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const debtor = await debtorRepository.getById(parsed.data.debtorId);
	if (!debtor) return { success: false, error: "El deudor ya no existe." };
	if (parsed.data.amount > debtor.balance) {
		return {
			success: false,
			error: `El abono no puede superar la deuda pendiente ($${debtor.balance}).`,
		};
	}

	const userId = await requireSessionUserId();
	await debtorRepository.recordMovement(
		debtor.id,
		{
			type: "abono",
			amount: parsed.data.amount,
			date: parsed.data.date,
			note: parsed.data.note?.trim() || undefined,
		},
		userId,
	);

	revalidatePath("/cierre-caja/deudores");
	revalidatePath(`/cierre-caja/deudores/${debtor.id}`);
	return { success: true };
}
