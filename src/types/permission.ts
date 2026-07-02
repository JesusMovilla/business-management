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
