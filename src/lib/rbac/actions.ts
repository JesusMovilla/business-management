import { PERMISSION_ACTIONS, type PermissionAction } from "@/types";

export type { PermissionAction };
export { PERMISSION_ACTIONS };

export const ACTION_LABELS: Record<PermissionAction, string> = {
	ver: "Ver",
	crear: "Crear",
	editar: "Editar",
	eliminar: "Eliminar",
};
