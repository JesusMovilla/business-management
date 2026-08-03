"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cashClosingRepository } from "@/data/repositories/cash-closing-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkAdmin, checkPermission } from "@/lib/rbac/require-permission";
import type {
	CashClosingWithItems,
	NewCashClosingItemInput,
	StockMovement,
} from "@/types";

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

async function getOpenDraftOrError(
	draftId: string,
): Promise<
	{ ok: true; draft: CashClosingWithItems } | { ok: false; error: string }
> {
	const draft = await cashClosingRepository.getOpenDraft();
	if (!draft || draft.id !== draftId) {
		return { ok: false, error: "El borrador ya no está abierto." };
	}
	return { ok: true, draft };
}

/** Abre el borrador de cierre en curso, o reusa el que ya esté abierto (solo puede haber uno). */
export async function startDraftAction(): Promise<
	CashClosingActionResult & { id?: string }
> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const existing = await cashClosingRepository.getOpenDraft();
	if (existing) return { success: true, id: existing.id };

	const userId = await requireSessionUserId();
	const today = new Date().toISOString().slice(0, 10);
	const id = await cashClosingRepository.createDraft(userId, today);
	revalidateCierreCaja();
	return { success: true, id };
}

const addDraftSaleSchema = z.object({
	draftId: z.string().min(1),
	paymentMethod: z.string().min(1, "El método de pago es obligatorio."),
	note: z.string().optional(),
	items: z
		.array(
			z.object({
				productId: z.string().min(1),
				quantitySold: z.coerce
					.number()
					.int()
					.min(1, "La cantidad debe ser mayor a 0."),
			}),
		)
		.min(1, "Agrega al menos un producto."),
});

/**
 * Registra una venta (uno o más productos, agrupados como una sola venta) en el borrador abierto.
 * Valida el stock disponible descontando lo que ya se registró en este mismo borrador para cada
 * producto — sumando también las cantidades repetidas dentro de esta misma venta — (el inventario
 * real recién se descuenta al finalizar, ver `finalizeCashClosingAction`).
 */
export async function addDraftSaleAction(
	input: unknown,
): Promise<CashClosingActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = addDraftSaleSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const opened = await getOpenDraftOrError(parsed.data.draftId);
	if (!opened.ok) return { success: false, error: opened.error };
	const draft = opened.draft;

	const products = await productRepository.listWithQuantity();
	const productMap = new Map(products.map((product) => [product.id, product]));

	const quantityInSubmissionByProduct = new Map<string, number>();
	for (const item of parsed.data.items) {
		quantityInSubmissionByProduct.set(
			item.productId,
			(quantityInSubmissionByProduct.get(item.productId) ?? 0) +
				item.quantitySold,
		);
	}

	const resolvedItems: NewCashClosingItemInput[] = [];
	for (const item of parsed.data.items) {
		const product = productMap.get(item.productId);
		if (!product)
			return {
				success: false,
				error: "Uno de los productos seleccionados ya no existe.",
			};

		const alreadyInDraft = draft.items
			.filter((existing) => existing.productId === item.productId)
			.reduce((sum, existing) => sum + existing.quantitySold, 0);
		const requestedTotal =
			quantityInSubmissionByProduct.get(item.productId) ?? 0;
		const available = product.stock.quantity - alreadyInDraft;
		if (requestedTotal > available) {
			return {
				success: false,
				error: `Stock insuficiente para ${product.name}: disponible ${available}.`,
			};
		}

		resolvedItems.push({
			productId: item.productId,
			quantitySold: item.quantitySold,
			unitPrice: product.pricing.retailPrice,
			unitCost: product.pricing.cost,
		});
	}

	const userId = await requireSessionUserId();
	await cashClosingRepository.addDraftSale(
		draft.id,
		{
			paymentMethod: parsed.data.paymentMethod,
			note: parsed.data.note?.trim() || undefined,
		},
		resolvedItems,
		userId,
	);

	revalidateCierreCaja();
	return { success: true };
}

const updateDraftItemQuantitySchema = z.object({
	draftId: z.string().min(1),
	itemId: z.string().min(1),
	quantitySold: z.coerce
		.number()
		.int()
		.min(1, "La cantidad debe ser mayor a 0."),
});

/** Corrige la cantidad de un producto ya registrado en una venta del borrador. */
export async function updateDraftItemQuantityAction(
	input: unknown,
): Promise<CashClosingActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = updateDraftItemQuantitySchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const opened = await getOpenDraftOrError(parsed.data.draftId);
	if (!opened.ok) return { success: false, error: opened.error };
	const draft = opened.draft;

	const existingItem = draft.items.find(
		(item) => item.id === parsed.data.itemId,
	);
	if (!existingItem)
		return { success: false, error: "Esa venta ya no existe." };

	const products = await productRepository.listWithQuantity();
	const product = products.find((p) => p.id === existingItem.productId);
	if (!product) return { success: false, error: "El producto ya no existe." };

	const alreadyInDraft = draft.items
		.filter(
			(item) =>
				item.productId === existingItem.productId &&
				item.id !== existingItem.id,
		)
		.reduce((sum, item) => sum + item.quantitySold, 0);
	const available = product.stock.quantity - alreadyInDraft;
	if (parsed.data.quantitySold > available) {
		return {
			success: false,
			error: `Stock insuficiente para ${product.name}: disponible ${available}.`,
		};
	}

	await cashClosingRepository.updateDraftItemQuantity(
		draft.id,
		parsed.data.itemId,
		parsed.data.quantitySold,
	);

	revalidateCierreCaja();
	return { success: true };
}

const updateDraftDateSchema = z.object({
	draftId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
});

/** Cambia la fecha del cierre en curso. */
export async function updateDraftDateAction(
	input: unknown,
): Promise<CashClosingActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = updateDraftDateSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const opened = await getOpenDraftOrError(parsed.data.draftId);
	if (!opened.ok) return { success: false, error: opened.error };

	await cashClosingRepository.updateDraftDate(
		parsed.data.draftId,
		parsed.data.date,
	);

	revalidateCierreCaja();
	return { success: true };
}

const removeDraftSaleSchema = z.object({
	draftId: z.string().min(1),
	itemId: z.string().min(1),
});

/** Deshace una venta registrada por error en el borrador, antes de finalizar. */
export async function removeDraftSaleItemAction(
	input: unknown,
): Promise<CashClosingActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = removeDraftSaleSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const opened = await getOpenDraftOrError(parsed.data.draftId);
	if (!opened.ok) return { success: false, error: opened.error };

	await cashClosingRepository.removeDraftItem(
		parsed.data.draftId,
		parsed.data.itemId,
	);

	revalidateCierreCaja();
	return { success: true };
}

/** Abandona el borrador en curso sin generar cierre ni tocar inventario. */
export async function cancelDraftAction(
	draftId: string,
): Promise<CashClosingActionResult> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const opened = await getOpenDraftOrError(draftId);
	if (!opened.ok) return { success: false, error: opened.error };

	await cashClosingRepository.cancelDraft(draftId);

	revalidateCierreCaja();
	return { success: true };
}

const finalizeSchema = z.object({
	draftId: z.string().min(1),
	actualCash: z.coerce.number().min(0, "Debe ser 0 o mayor."),
	reason: z.string().optional(),
});

/**
 * Cierra el borrador: revalida el stock disponible por si cambió desde que se registraron las
 * ventas (mismo criterio defensivo que `updateCashClosingAction`), recalcula el ingreso esperado
 * desde los ítems del borrador y escribe los movimientos de inventario — todo en
 * `cashClosingRepository.finalize`.
 */
export async function finalizeCashClosingAction(
	input: unknown,
): Promise<CashClosingActionResult & { id?: string }> {
	const authz = await checkPermission("cierre-caja", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = finalizeSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const draft = await cashClosingRepository.getOpenDraft();
	if (!draft || draft.id !== parsed.data.draftId) {
		return { success: false, error: "El borrador ya no está abierto." };
	}
	if (draft.items.length === 0) {
		return {
			success: false,
			error: "Registra al menos una venta antes de finalizar.",
		};
	}

	const products = await productRepository.listWithQuantity();
	const productMap = new Map(products.map((product) => [product.id, product]));

	const quantityByProduct = new Map<string, number>();
	for (const item of draft.items) {
		quantityByProduct.set(
			item.productId,
			(quantityByProduct.get(item.productId) ?? 0) + item.quantitySold,
		);
	}
	for (const [productId, quantitySold] of quantityByProduct) {
		const product = productMap.get(productId);
		if (!product)
			return {
				success: false,
				error: "Uno de los productos vendidos ya no existe.",
			};
		if (quantitySold > product.stock.quantity) {
			return {
				success: false,
				error: `Stock insuficiente para ${product.name}: disponible ${product.stock.quantity}, se registraron ${quantitySold} ventas.`,
			};
		}
	}

	const expectedIncome = draft.items.reduce(
		(sum, item) => sum + item.quantitySold * item.unitPrice,
		0,
	);
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
	await cashClosingRepository.finalize(
		draft.id,
		{ expectedIncome, actualCash: parsed.data.actualCash, difference, reason },
		userId,
	);

	revalidateCierreCaja(draft.id);
	return { success: true, id: draft.id };
}

const cashClosingItemSchema = z.object({
	productId: z.string().min(1),
	quantitySold: z.coerce
		.number()
		.int()
		.min(1, "La cantidad debe ser mayor a 0."),
});

const updateCashClosingSchema = z.object({
	id: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
	items: z
		.array(cashClosingItemSchema)
		.min(1, "Agrega al menos un producto vendido."),
	actualCash: z.coerce.number().min(0, "Debe ser 0 o mayor."),
	reason: z.string().optional(),
});

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
	if (existing.status !== "activo") {
		return {
			success: false,
			error: "Solo se puede editar un cierre activo.",
		};
	}

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
		unitCost: number;
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
				unitCost: product.pricing.cost,
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

/**
 * Revierte un cierre ya guardado — reservada al rol Administrador sin excepción, mismo criterio
 * que editar. Devuelve al inventario la cantidad vendida de cada ítem vía movimientos `ajuste`
 * (el ledger `stock_movements` es append-only) y marca el cierre como `revertido` sin borrarlo,
 * preservando el historial. Ver `docs/DECISIONS.md`.
 */
export async function revertCashClosingAction(
	id: string,
	reason: string,
): Promise<CashClosingActionResult> {
	const authz = await checkAdmin();
	if (authz) return { success: false, error: authz.error };

	if (!reason.trim()) {
		return {
			success: false,
			error: "Indica un motivo para revertir el cierre.",
		};
	}

	const existing = await cashClosingRepository.getById(id);
	if (!existing)
		return { success: false, error: "El cierre de caja no existe." };
	if (existing.status !== "activo") {
		return {
			success: false,
			error: "Solo se puede revertir un cierre activo.",
		};
	}

	const userId = await requireSessionUserId();
	await cashClosingRepository.revert(
		id,
		existing.date,
		existing.items,
		reason.trim(),
		userId,
	);

	revalidateCierreCaja(id);
	return { success: true };
}
