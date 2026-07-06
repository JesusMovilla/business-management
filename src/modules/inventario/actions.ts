"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categoryRepository } from "@/data/repositories/category-repository";
import { productRepository } from "@/data/repositories/product-repository";
import { stockMovementRepository } from "@/data/repositories/stock-movement-repository";
import { supplierRepository } from "@/data/repositories/supplier-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { checkAdmin, checkPermission } from "@/lib/rbac/require-permission";
import type { MermaReason, NewProductInput, StockMovementType } from "@/types";
import { MERMA_REASONS } from "@/types";
import { newProductInputSchema } from "./components/product-form-schema";

export type InventoryActionResult =
	| { success: true }
	| { success: false; error: string };

function firstIssueMessage(error: { issues: { message: string }[] }): string {
	return error.issues[0]?.message ?? "Datos inválidos.";
}

function revalidateInventory() {
	revalidatePath("/inventario", "layout");
}

async function requireSessionUserId(): Promise<string> {
	const session = await getCurrentSession();
	if (!session?.user) throw new Error("No autenticado.");
	return session.user.id;
}

// --- Productos ---------------------------------------------------------

export async function createProductAction(
	input: unknown,
	initialQuantity: number,
): Promise<InventoryActionResult & { id?: string }> {
	const authz = await checkPermission("inventario", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = newProductInputSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	const id = await productRepository.createWithInitialEntry(
		parsed.data as NewProductInput,
		initialQuantity,
		userId,
	);
	revalidateInventory();
	return { success: true, id };
}

export async function updateProductAction(
	id: string,
	input: unknown,
): Promise<InventoryActionResult> {
	const authz = await checkPermission("inventario", "editar");
	if (authz) return { success: false, error: authz.error };

	const parsed = newProductInputSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	await productRepository.update(id, parsed.data as NewProductInput);
	revalidateInventory();
	return { success: true };
}

export async function removeProductAction(
	id: string,
): Promise<InventoryActionResult> {
	const authz = await checkPermission("inventario", "eliminar");
	if (authz) return { success: false, error: authz.error };

	await productRepository.remove(id);
	revalidateInventory();
	return { success: true };
}

// --- Categorías ----------------------------------------------------------

const categoryInputSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	description: z.string().optional(),
});

export async function createCategoryAction(
	input: unknown,
): Promise<InventoryActionResult & { id?: string }> {
	const authz = await checkPermission("inventario", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = categoryInputSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const id = await categoryRepository.create(parsed.data);
	revalidateInventory();
	return { success: true, id };
}

export async function removeCategoryAction(
	id: string,
): Promise<InventoryActionResult> {
	const authz = await checkPermission("inventario", "eliminar");
	if (authz) return { success: false, error: authz.error };

	await categoryRepository.remove(id);
	revalidateInventory();
	return { success: true };
}

// --- Proveedores -----------------------------------------------------------

const supplierInputSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	contactName: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().optional(),
	address: z.string().optional(),
	notes: z.string().optional(),
});

export async function createSupplierAction(
	input: unknown,
): Promise<InventoryActionResult & { id?: string }> {
	const authz = await checkPermission("inventario", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = supplierInputSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const id = await supplierRepository.create(parsed.data);
	revalidateInventory();
	return { success: true, id };
}

export async function removeSupplierAction(
	id: string,
): Promise<InventoryActionResult> {
	const authz = await checkPermission("inventario", "eliminar");
	if (authz) return { success: false, error: authz.error };

	await supplierRepository.remove(id);
	revalidateInventory();
	return { success: true };
}

// --- Movimientos de stock ----------------------------------------------

const manualMovementSchema = z.object({
	productId: z.string().min(1),
	type: z.enum(["entrada", "venta", "merma", "ajuste"]),
	delta: z.number().refine((n) => n !== 0, "La cantidad no puede ser 0."),
	reason: z.enum(MERMA_REASONS).optional(),
	note: z.string().optional(),
});

/**
 * Movimiento manual desde el detalle de un producto — reservado al rol Administrador sin
 * excepción (bypassa la matriz de permisos, ver `docs/RBAC.md`). Cubre los 4 tipos.
 */
export async function createManualStockMovementAction(
	input: unknown,
): Promise<InventoryActionResult> {
	const authz = await checkAdmin();
	if (authz) return { success: false, error: authz.error };

	const parsed = manualMovementSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	await stockMovementRepository.create({
		productId: parsed.data.productId,
		type: parsed.data.type as StockMovementType,
		delta: parsed.data.delta,
		date: new Date().toISOString(),
		reason: parsed.data.reason as MermaReason | undefined,
		note: parsed.data.note,
		userId,
	});
	revalidateInventory();
	return { success: true };
}

const bulkEntradaSchema = z.object({
	rows: z
		.array(
			z.object({
				productId: z.string().min(1),
				quantity: z.number().positive(),
			}),
		)
		.min(1, "Agrega al menos una línea."),
	note: z.string().optional(),
});

/** Entrada masiva por compra — vía normal para ingresar stock, permiso `inventario.crear`. */
export async function createBulkEntradaAction(
	input: unknown,
): Promise<InventoryActionResult> {
	const authz = await checkPermission("inventario", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = bulkEntradaSchema.safeParse(input);
	if (!parsed.success)
		return { success: false, error: firstIssueMessage(parsed.error) };

	const userId = await requireSessionUserId();
	const date = new Date().toISOString();
	await stockMovementRepository.createBatch(
		parsed.data.rows.map((row) => ({
			productId: row.productId,
			type: "entrada" as StockMovementType,
			delta: row.quantity,
			date,
			note: parsed.data.note,
			userId,
		})),
	);
	revalidateInventory();
	return { success: true };
}
