"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cashClosingRepository } from "@/data/repositories/cash-closing-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkAdmin, checkPermission } from "@/lib/rbac/require-permission";
import type { StockMovement } from "@/types";

export type CashClosingActionResult =
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

function revalidateCierreCaja(id?: string) {
	revalidatePath("/cierre-caja");
	if (id) revalidatePath(`/cierre-caja/${id}`);
}

const cashClosingItemSchema = z.object({
	productId: z.string().min(1),
	quantitySold: z.coerce
		.number()
		.int()
		.min(1, "La cantidad debe ser mayor a 0."),
});

const createCashClosingSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
	items: z
		.array(cashClosingItemSchema)
		.min(1, "Agrega al menos un producto vendido."),
	actualCash: z.coerce.number().min(0, "Debe ser 0 o mayor."),
	reason: z.string().optional(),
});

const updateCashClosingSchema = createCashClosingSchema.extend({
	id: z.string().min(1),
});

export async function createCashClosingAction(
	input: unknown,
): Promise<CashClosingActionResult & { id?: string }> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = createCashClosingSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const products = await productRepository.listWithQuantity();
	const productMap = new Map(products.map((product) => [product.id, product]));

	let expectedIncome = 0;
	const resolvedItems: {
		productId: string;
		quantitySold: number;
		unitPrice: number;
	}[] = [];
	for (const item of parsed.data.items) {
		const product = productMap.get(item.productId);
		if (!product)
			return {
				success: false,
				error: "Uno de los productos seleccionados ya no existe.",
			};
		if (item.quantitySold > product.stock.quantity) {
			return {
				success: false,
				error: `Stock insuficiente para ${product.name}: disponible ${product.stock.quantity}.`,
			};
		}
		expectedIncome += item.quantitySold * product.pricing.retailPrice;
		resolvedItems.push({
			productId: item.productId,
			quantitySold: item.quantitySold,
			unitPrice: product.pricing.retailPrice,
		});
	}

	const difference = parsed.data.actualCash - expectedIncome;
	const reason = parsed.data.reason?.trim() || undefined;
	if (difference !== 0 && !reason) {
		return {
			success: false,
			error:
				"Debes indicar un motivo cuando el dinero real no coincide con el esperado.",
		};
	}

	const userId = await requireSessionUserId();
	const now = new Date().toISOString();
	const id = await cashClosingRepository.create(
		{
			date: parsed.data.date,
			expectedIncome,
			actualCash: parsed.data.actualCash,
			difference,
			reason,
			createdBy: userId,
			createdAt: now,
			updatedAt: now,
		},
		resolvedItems,
	);

	revalidateCierreCaja();
	return { success: true, id };
}

/**
 * Edición de un cierre ya guardado — reservada al rol Administrador sin excepción (bypassa la
 * matriz de permisos, mismo patrón que `createManualStockMovementAction` en Inventario). Los
 * movimientos `stock_movements` son un ledger append-only: en vez de mutarlos, se generan
 * movimientos `ajuste` que reconcilian la diferencia entre las cantidades viejas y nuevas de
 * cada producto. Ver `docs/DECISIONS.md`.
 */
export async function updateCashClosingAction(
	input: unknown,
): Promise<CashClosingActionResult> {
	const authz = await checkAdmin();
	if (authz) return { success: false, error: authz.error };

	const parsed = updateCashClosingSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const existing = await cashClosingRepository.getById(parsed.data.id);
	if (!existing)
		return { success: false, error: "El cierre de caja no existe." };

	const products = await productRepository.listWithQuantity();
	const productMap = new Map(products.map((product) => [product.id, product]));

	const oldQuantityByProduct = new Map(
		existing.items.map((item) => [item.productId, item.quantitySold]),
	);
	const newQuantityByProduct = new Map(
		parsed.data.items.map((item) => [item.productId, item.quantitySold]),
	);
	const affectedProductIds = new Set([
		...oldQuantityByProduct.keys(),
		...newQuantityByProduct.keys(),
	]);

	const userId = await requireSessionUserId();
	const now = new Date().toISOString();

	let expectedIncome = 0;
	const resolvedItems: {
		productId: string;
		quantitySold: number;
		unitPrice: number;
	}[] = [];
	const compensatingMovements: Omit<StockMovement, "id">[] = [];

	for (const productId of affectedProductIds) {
		const product = productMap.get(productId);
		if (!product)
			return {
				success: false,
				error: "Uno de los productos del cierre ya no existe.",
			};

		const oldQuantity = oldQuantityByProduct.get(productId) ?? 0;
		const newQuantity = newQuantityByProduct.get(productId) ?? 0;
		const deltaIncrease = newQuantity - oldQuantity;

		if (deltaIncrease > 0 && product.stock.quantity < deltaIncrease) {
			return {
				success: false,
				error: `Stock insuficiente para ${product.name}: disponible ${product.stock.quantity}, necesitas ${deltaIncrease} más.`,
			};
		}

		if (deltaIncrease !== 0) {
			compensatingMovements.push({
				productId,
				type: "ajuste",
				delta: -deltaIncrease,
				date: now,
				note: `Corrección de cierre de caja del ${existing.date}`,
				userId,
			});
		}

		if (newQuantity > 0) {
			expectedIncome += newQuantity * product.pricing.retailPrice;
			resolvedItems.push({
				productId,
				quantitySold: newQuantity,
				unitPrice: product.pricing.retailPrice,
			});
		}
	}

	const difference = parsed.data.actualCash - expectedIncome;
	const reason = parsed.data.reason?.trim() || undefined;
	if (difference !== 0 && !reason) {
		return {
			success: false,
			error:
				"Debes indicar un motivo cuando el dinero real no coincide con el esperado.",
		};
	}

	await cashClosingRepository.update(
		parsed.data.id,
		{
			date: parsed.data.date,
			expectedIncome,
			actualCash: parsed.data.actualCash,
			difference,
			reason,
		},
		resolvedItems,
		compensatingMovements,
		userId,
	);

	revalidateCierreCaja(parsed.data.id);
	return { success: true };
}
