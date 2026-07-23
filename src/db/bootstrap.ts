import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/auth";
import { ROLE_ADMIN_ID } from "@/lib/rbac/constants";
import type { PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";
import { db } from "./client";
import { user } from "./schema/auth";
import { expenseCategories } from "./schema/expenses";
import { roles } from "./schema/roles";

const COMPRA_MERCANCIA_CATEGORY_ID = "exp-cat-compra-mercancia";

function buildFullAccessPermissions(): PermissionTree {
	return APP_MODULES.map((module) => ({
		module,
		actions: { ver: true, crear: true, editar: true, eliminar: true },
	}));
}

/**
 * Sin este rol no hay forma de iniciar sesión ni de administrar permisos — es infraestructura del
 * sistema, no un dato de negocio, así que se sigue provisionando acá (a diferencia de los mocks de
 * demo que se eliminaron por completo, ver docs/DECISIONS.md).
 */
async function ensureAdminRole() {
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
	console.log("Rol Administrador listo.");
}

/**
 * También la autoprovisiona `purchaseOrderRepository.receive()` al confirmar el primer pedido, pero
 * crearla acá de una vez la deja visible en /gastos/categorias desde el día uno.
 */
async function ensureExpenseCategories() {
	await db
		.insert(expenseCategories)
		.values({ id: COMPRA_MERCANCIA_CATEGORY_ID, name: "Compra de mercancía" })
		.onConflictDoNothing();
	console.log('Categoría de gasto "Compra de mercancía" lista.');
}

/**
 * No hay flujo de invitación por email: el primer usuario se crea acá, una sola vez, a partir de
 * variables de entorno (nunca hardcodeado a una persona específica). Los siguientes usuarios se
 * crean desde /admin/usuarios una vez que alguien ya inició sesión con este.
 */
async function ensureFirstUser() {
	const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
	const name = process.env.BOOTSTRAP_ADMIN_NAME;

	if (!email || !name) {
		console.log(
			"BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_NAME no están definidas — no se crea " +
				"ningún usuario. Defínelas (ej. en .env.local) y vuelve a correr " +
				"`npm run db:bootstrap` si necesitas el primer usuario del sistema.",
		);
		return;
	}

	const [existing] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email));
	if (existing) {
		console.log(`Usuario (${email}) ya existe — no se toca.`);
		return;
	}

	const password = randomBytes(9).toString("base64url");
	await auth.api.signUpEmail({
		body: { name, email, password, roleId: ROLE_ADMIN_ID, active: true },
	});

	console.log(
		"\n=== CREDENCIAL DE ADMINISTRADOR (se muestra una sola vez) ===",
	);
	console.log(`Email:      ${email}`);
	console.log(`Contraseña: ${password}`);
	console.log(
		"Cámbiala desde 'Cambiar contraseña' en el menú de usuario apenas inicies sesión.",
	);
	console.log(
		"===============================================================\n",
	);
}

async function bootstrap() {
	await ensureAdminRole();
	await ensureExpenseCategories();
	await ensureFirstUser();
	process.exit(0);
}

bootstrap().catch((error) => {
	console.error(error);
	process.exit(1);
});
