import type { AppModule, PermissionTree } from "@/types";
import { APP_MODULES } from "@/types";

type FullAccessOverride = Partial<Record<AppModule, boolean>>;

function buildTree(
	defaultView: boolean,
	overrides: FullAccessOverride = {},
): PermissionTree {
	return APP_MODULES.map((module) => {
		const fullAccess = overrides[module] ?? false;
		return {
			module,
			actions: {
				ver: fullAccess || defaultView,
				crear: fullAccess,
				editar: fullAccess,
				eliminar: fullAccess,
			},
		};
	});
}

export function buildAdminPermissions(): PermissionTree {
	return APP_MODULES.map((module) => ({
		module,
		actions: { ver: true, crear: true, editar: true, eliminar: true },
	}));
}

export function buildVendedorPermissions(): PermissionTree {
	const tree = buildTree(false, { pedidos: true });
	return tree.map((entry) =>
		entry.module === "inventario"
			? { ...entry, actions: { ...entry.actions, ver: true } }
			: entry,
	);
}

export function buildCajeroPermissions(): PermissionTree {
	const tree = buildTree(false, { "cierre-caja": true });
	return tree.map((entry) =>
		entry.module === "inventario"
			? { ...entry, actions: { ...entry.actions, ver: true } }
			: entry,
	);
}

export function buildBodegaPermissions(): PermissionTree {
	return buildTree(false, { inventario: true });
}
