import { eq } from "drizzle-orm";
import { APP_MODULES } from "@/types";
import { db } from "./client";
import { roles } from "./schema";

/**
 * Cada rol guarda su matriz de permisos como un `PermissionTree` fijo en `roles.permissions`
 * (jsonb) — no se recalcula contra `APP_MODULES` al leerlo. Agregar un módulo nuevo a
 * `APP_MODULES` (como "rentabilidad") no actualiza los roles ya existentes en la base: el nav
 * (`can()`) lo trata como sin acceso, y el editor de permisos (`role-edit-form.tsx`, que inicializa
 * su estado directo desde `role.permissions`) no puede ni activarlo, porque
 * `togglePermissionEntry` solo actualiza una entrada que ya exista en el árbol — si el módulo no
 * está, el toggle es un no-op silencioso.
 *
 * Este backfill agrega la entrada faltante a todo rol que no la tenga: acceso total para el rol
 * Administrador (`isSystem`, coherente con `buildFullAccessPermissions` de `bootstrap.ts`) y sin
 * acceso (todo en `false`) para el resto — el admin decide después, desde la matriz, a quién más
 * dársela. Igual que `backfill-unit-cost.ts`: script `tsx` idempotente, de una sola vez.
 */
async function backfillRolePermissions() {
	const allRoles = await db.select().from(roles);
	let updated = 0;

	for (const role of allRoles) {
		const missingModules = APP_MODULES.filter(
			(module) => !role.permissions.some((entry) => entry.module === module),
		);
		if (missingModules.length === 0) continue;

		const newEntries = missingModules.map((module) => ({
			module,
			actions: {
				ver: role.isSystem,
				crear: role.isSystem,
				editar: role.isSystem,
				eliminar: role.isSystem,
			},
		}));

		await db
			.update(roles)
			.set({
				permissions: [...role.permissions, ...newEntries],
				updatedAt: new Date().toISOString(),
			})
			.where(eq(roles.id, role.id));

		updated++;
		console.log(
			`Rol "${role.name}": agregado(s) ${missingModules.join(", ")}.`,
		);
	}

	console.log(`${updated} rol(es) actualizado(s) de ${allRoles.length} total.`);
}

backfillRolePermissions()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
