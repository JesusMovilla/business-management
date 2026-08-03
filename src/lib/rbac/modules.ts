import type { AppModule, PermissionAction } from "@/types";

export type { AppModule };

export const MODULE_LABELS: Record<AppModule, string> = {
	inventario: "Inventario",
	pedidos: "Pedidos",
	rentabilidad: "Rentabilidad y proyecciones",
	inversion: "Control de inversión",
	gastos: "Control de gastos",
	"cierre-caja": "Cierre de caja",
	contactos: "Libreta de contactos",
	calendario: "Calendario",
	admin: "Configuración",
};

/**
 * Acciones que la matriz de permisos no debe ofrecer para ciertos módulos porque el código nunca
 * las consulta: en Cierre de caja, editar/revertir un cierre ya finalizado usa `checkAdmin()`
 * (exclusivo del rol Administrador, ver `require-permission.ts`), no la matriz — un rol con
 * `editar`/`eliminar` marcados en `cierre-caja` no obtendría ningún permiso real.
 * `PermissionTreeEditor` las muestra deshabilitadas con una nota en vez de como un interruptor
 * normal, para no sugerir un control que no existe.
 */
export const MODULE_HIDDEN_ACTIONS: Partial<
	Record<AppModule, PermissionAction[]>
> = {
	"cierre-caja": ["editar", "eliminar"],
};
