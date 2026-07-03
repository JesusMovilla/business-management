import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { ROLE_ADMIN_ID } from "@/lib/rbac/constants";
import { contactsMock } from "@/modules/contactos/mock-data/contacts.mock";
import type { PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";
import { db } from "./client";
import { contacts, roles, user } from "./schema";

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

async function seedSuperAdmin() {
	const [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, SUPER_ADMIN_EMAIL));

	if (existing) {
		console.log(
			`Usuario super admin (${SUPER_ADMIN_EMAIL}) ya existe — no se toca.`,
		);
		return;
	}

	const password = randomBytes(9).toString("base64url");
	await auth.api.signUpEmail({
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
}

async function seed() {
	await seedContacts();
	await seedAdminRole();
	await seedSuperAdmin();
	process.exit(0);
}

seed().catch((error) => {
	console.error(error);
	process.exit(1);
});
