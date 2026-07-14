"use server";

import { revalidatePath } from "next/cache";
import { investmentGroupRepository } from "@/data/repositories/investment-group-repository";
import { investmentRepository } from "@/data/repositories/investment-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/rbac/require-permission";
import {
	investmentFormSchema,
	investmentGroupFormSchema,
} from "./components/investment-form-schema";

export type InvestmentActionResult =
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

function revalidateInversion() {
	revalidatePath("/inversion");
	revalidatePath("/inversion/grupos");
}

export async function createInvestmentAction(
	input: unknown,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = investmentFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await investmentRepository.create(
		{ ...parsed.data, status: "activa" },
		userId,
	);
	revalidateInversion();
	return { success: true };
}

export async function updateInvestmentAction(
	id: string,
	input: unknown,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "editar");
	if (authz) return { success: false, error: authz.error };

	const existing = await investmentRepository.getById(id);
	if (!existing) return { success: false, error: "La inversión no existe." };
	if (existing.status === "anulada") {
		return {
			success: false,
			error: "No se puede editar una inversión anulada.",
		};
	}

	const parsed = investmentFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await investmentRepository.update(id, parsed.data, userId);
	revalidateInversion();
	return { success: true };
}

export async function voidInvestmentAction(
	id: string,
	reason: string,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "eliminar");
	if (authz) return { success: false, error: authz.error };

	if (!reason.trim()) {
		return {
			success: false,
			error: "Indica un motivo para anular la inversión.",
		};
	}
	const existing = await investmentRepository.getById(id);
	if (!existing) return { success: false, error: "La inversión no existe." };
	if (existing.status === "anulada") {
		return { success: false, error: "La inversión ya está anulada." };
	}

	const userId = await requireSessionUserId();
	await investmentRepository.void(id, reason.trim(), userId);
	revalidateInversion();
	return { success: true };
}

export async function createInvestmentGroupAction(
	input: unknown,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = investmentGroupFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	await investmentGroupRepository.create(parsed.data);
	revalidateInversion();
	return { success: true };
}

export async function updateInvestmentGroupAction(
	id: string,
	input: unknown,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "editar");
	if (authz) return { success: false, error: authz.error };

	const parsed = investmentGroupFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	await investmentGroupRepository.update(id, parsed.data);
	revalidateInversion();
	return { success: true };
}

export async function removeInvestmentGroupAction(
	id: string,
): Promise<InvestmentActionResult> {
	const authz = await checkPermission("inversion", "eliminar");
	if (authz) return { success: false, error: authz.error };

	await investmentGroupRepository.remove(id);
	revalidateInversion();
	return { success: true };
}
