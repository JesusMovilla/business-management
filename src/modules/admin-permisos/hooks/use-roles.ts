"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { PermissionTree, Role } from "@/types";
import { deleteRoleAction, updateRoleAction } from "../actions";

export function useRolesListController(initialRoles: Role[]) {
	const [isPending, startTransition] = useTransition();
	const [roles, applyOptimistic] = useOptimistic(
		initialRoles,
		(state, removedId: string) => state.filter((role) => role.id !== removedId),
	);

	const deleteRole = (id: string) => {
		startTransition(async () => {
			applyOptimistic(id);
			await toast
				.promise(
					(async () => {
						const result = await deleteRoleAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Eliminando rol...",
						success: "Rol eliminado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo eliminar el rol.",
					},
				)
				.catch(() => {});
		});
	};

	return { roles, deleteRole, isPending };
}

/**
 * A diferencia de Contactos/Roles-lista, editar un rol no manda cada cambio al servidor al
 * instante: `name`/`description`/`permissions` se editan localmente en `RoleEditForm` (por eso
 * este hook no expone estado, solo la mutación) y se mandan juntos en un solo
 * `updateRoleAction` al presionar "Guardar rol" — togglear un permiso no debe sentirse como una
 * llamada de red por cada click.
 */
export function useRoleEditController(roleId: string) {
	const [isPending, startTransition] = useTransition();

	const updateRole = (patch: {
		name: string;
		description?: string;
		permissions: PermissionTree;
	}) => {
		startTransition(async () => {
			await toast
				.promise(
					(async () => {
						const result = await updateRoleAction(roleId, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Guardando rol...",
						success: "Rol actualizado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el rol.",
					},
				)
				.catch(() => {});
		});
	};

	return { updateRole, isPending };
}
