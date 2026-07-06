export const APP_MODULES = [
	"inventario",
	"pedidos",
	"proyeccion",
	"inversion",
	"gastos",
	"cierre-caja",
	"contactos",
	"calendario",
	"admin",
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const PERMISSION_ACTIONS = [
	"ver",
	"crear",
	"editar",
	"eliminar",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface ModulePermission {
	module: AppModule;
	actions: Record<PermissionAction, boolean>;
}

export type PermissionTree = ModulePermission[];

export function buildEmptyPermissionTree(): PermissionTree {
	return APP_MODULES.map((module) => ({
		module,
		actions: { ver: false, crear: false, editar: false, eliminar: false },
	}));
}

/**
 * Alterna una acción de un módulo dentro del árbol de permisos: activar `crear`/`editar`/
 * `eliminar` activa `ver` (son prerequisito), y desactivar `ver` desactiva las demás.
 */
export function togglePermissionEntry(
	tree: PermissionTree,
	module: AppModule,
	action: PermissionAction,
): PermissionTree {
	return tree.map((entry) => {
		if (entry.module !== module) return entry;
		const nextValue = !entry.actions[action];
		const actions = { ...entry.actions, [action]: nextValue };
		if (action === "ver" && !nextValue) {
			actions.crear = false;
			actions.editar = false;
			actions.eliminar = false;
		}
		if (action !== "ver" && nextValue) {
			actions.ver = true;
		}
		return { ...entry, actions };
	});
}
