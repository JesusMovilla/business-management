import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { ROLE_ADMIN_ID } from "@/lib/rbac/constants";
import { contactsMock } from "@/modules/contactos/mock-data/contacts.mock";
import { categoriesMock } from "@/modules/inventario/mock-data/categories.mock";
import { productsMock } from "@/modules/inventario/mock-data/products.mock";
import { buildStockMovementsMock } from "@/modules/inventario/mock-data/stock-movements.mock";
import type { PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";
import { db } from "./client";
import { user } from "./schema/auth";
import { contacts } from "./schema/contacts";
import { categories, products, stockMovements } from "./schema/inventory";
import { roles } from "./schema/roles";

const SUPER_ADMIN_EMAIL = "jmovilla@comercializadora-s3.com";
const SUPER_ADMIN_NAME = "Juan Movilla";

function buildFullAccessPermissions(): PermissionTree {
	return APP_MODULES.map((module) => ({
		module,
		actions: { ver: true, crear: true, editar: true, eliminar: true },
	}));
}

async function seedContacts() {
	await db.insert(contacts).values(contactsMock).onConflictDoNothing();
	console.log(`Contactos: ${contactsMock.length} sembrados (o ya existentes).`);
}

async function seedAdminRole() {
	const now = new Date().toISOString();
	await db
		.insert(roles)
		.values({
			id: ROLE_ADMIN_ID,
			name: "Administrador",
			description: "Acceso total a todos los módulos del sistema.",
			isSystem: true,
			permissions: buildFullAccessPermissions(),
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoNothing();
	console.log("Rol Administrador sembrado (o ya existente).");
}

async function seedSuperAdmin(): Promise<string> {
	const [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, SUPER_ADMIN_EMAIL));

	if (existing) {
		console.log(
			`Usuario super admin (${SUPER_ADMIN_EMAIL}) ya existe — no se toca.`,
		);
		return existing.id;
	}

	const password = randomBytes(9).toString("base64url");
	const result = await auth.api.signUpEmail({
		body: {
			name: SUPER_ADMIN_NAME,
			email: SUPER_ADMIN_EMAIL,
			password,
			roleId: ROLE_ADMIN_ID,
			active: true,
		},
	});

	console.log("\n=== CREDENCIAL DE SUPER ADMIN (se muestra una sola vez) ===");
	console.log(`Email:      ${SUPER_ADMIN_EMAIL}`);
	console.log(`Contraseña: ${password}`);
	console.log(
		"Cambiala desde 'Cambiar contraseña' en el menú de usuario apenas inicies sesión.",
	);
	console.log(
		"=============================================================\n",
	);
	return result.user.id;
}

async function seedCategories() {
	await db.insert(categories).values(categoriesMock).onConflictDoNothing();
	console.log(
		`Categorías: ${categoriesMock.length} sembradas (o ya existentes).`,
	);
}

async function seedProducts() {
	const rows = productsMock.map((product) => ({
		id: product.id,
		name: product.name,
		brand: product.brand,
		categoryId: product.categoryId,
		presentation: product.presentation,
		volumeMl: product.volumeMl ?? null,
		minStock: product.stock.minStock,
		cost: product.pricing.cost,
		retailPrice: product.pricing.retailPrice,
		lastPurchaseDate: product.lastPurchaseDate ?? null,
		imageUrl: product.imageUrl ?? null,
		active: product.active,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	}));
	await db.insert(products).values(rows).onConflictDoNothing();
	console.log(`Productos: ${rows.length} sembrados (o ya existentes).`);
}

async function seedStockMovements(userId: string) {
	const rows = buildStockMovementsMock(userId);
	await db.insert(stockMovements).values(rows).onConflictDoNothing();
	console.log(
		`Movimientos de stock: ${rows.length} sembrados (o ya existentes).`,
	);
}

async function seed() {
	await seedContacts();
	await seedAdminRole();
	const superAdminId = await seedSuperAdmin();
	await seedCategories();
	await seedProducts();
	await seedStockMovements(superAdminId);
	process.exit(0);
}

seed().catch((error) => {
	console.error(error);
	process.exit(1);
});
