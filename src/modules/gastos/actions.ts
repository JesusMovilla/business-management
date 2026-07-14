"use server";

import { revalidatePath } from "next/cache";
import { expenseCategoryRepository } from "@/data/repositories/expense-category-repository";
import { expenseRepository } from "@/data/repositories/expense-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkPermission } from "@/lib/rbac/require-permission";
import {
	expenseCategoryFormSchema,
	expenseFormSchema,
} from "./components/expense-form-schema";

export type ExpenseActionResult =
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

function revalidateGastos() {
	revalidatePath("/gastos");
}

export async function createExpenseAction(
	input: unknown,
): Promise<ExpenseActionResult> {
	const authz = await checkPermission("gastos", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = expenseFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await expenseRepository.create(parsed.data, userId);
	revalidateGastos();
	return { success: true };
}

export async function updateExpenseAction(
	id: string,
	input: unknown,
): Promise<ExpenseActionResult> {
	const authz = await checkPermission("gastos", "editar");
	if (authz) return { success: false, error: authz.error };

	const existing = await expenseRepository.getById(id);
	if (!existing) return { success: false, error: "El gasto no existe." };
	if (existing.status === "anulado") {
		return { success: false, error: "No se puede editar un gasto anulado." };
	}

	const parsed = expenseFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await expenseRepository.update(id, parsed.data, userId);
	revalidateGastos();
	return { success: true };
}

export async function voidExpenseAction(
	id: string,
	reason: string,
): Promise<ExpenseActionResult> {
	const authz = await checkPermission("gastos", "eliminar");
	if (authz) return { success: false, error: authz.error };

	if (!reason.trim()) {
		return { success: false, error: "Indica un motivo para anular el gasto." };
	}
	const existing = await expenseRepository.getById(id);
	if (!existing) return { success: false, error: "El gasto no existe." };
	if (existing.status === "anulado") {
		return { success: false, error: "El gasto ya está anulado." };
	}

	const userId = await requireSessionUserId();
	await expenseRepository.void(id, reason.trim(), userId);
	revalidateGastos();
	return { success: true };
}

export async function createExpenseCategoryAction(
	input: unknown,
): Promise<ExpenseActionResult> {
	const authz = await checkPermission("gastos", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = expenseCategoryFormSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	await expenseCategoryRepository.create(parsed.data);
	revalidatePath("/gastos");
	revalidatePath("/gastos/categorias");
	return { success: true };
}

export async function removeExpenseCategoryAction(
	id: string,
): Promise<ExpenseActionResult> {
	const authz = await checkPermission("gastos", "eliminar");
	if (authz) return { success: false, error: authz.error };

	await expenseCategoryRepository.remove(id);
	revalidatePath("/gastos");
	revalidatePath("/gastos/categorias");
	return { success: true };
}
