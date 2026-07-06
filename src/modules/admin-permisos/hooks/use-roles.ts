"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type {
	AppModule,
	PermissionAction,
	PermissionTree,
	Role,
} from "@/types";
import {
	deleteRoleAction,
	togglePermissionAction,
	updateRoleAction,
} from "../actions";

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

type RoleEditAction =
	| { type: "update"; patch: Partial<Pick<Role, "name" | "description">> }
	| { type: "toggle"; module: AppModule; action: PermissionAction };

function toggleEntry(
	permissions: PermissionTree,
	module: AppModule,
	action: PermissionAction,
): PermissionTree {
	return permissions.map((entry) => {
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

export function useRoleEditController(initialRole: Role) {
	const [isPending, startTransition] = useTransition();
	const [role, applyOptimistic] = useOptimistic(
		initialRole,
		(state, roleAction: RoleEditAction) =>
			roleAction.type === "update"
				? { ...state, ...roleAction.patch }
				: {
						...state,
						permissions: toggleEntry(
							state.permissions,
							roleAction.module,
							roleAction.action,
						),
					},
	);

	const updateRole = (patch: Partial<Pick<Role, "name" | "description">>) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", patch });
			await toast
				.promise(
					(async () => {
						const result = await updateRoleAction(role.id, {
							name: patch.name ?? role.name,
							description: patch.description,
						});
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

	const togglePermission = (module: AppModule, action: PermissionAction) => {
		startTransition(async () => {
			applyOptimistic({ type: "toggle", module, action });
			const result = await togglePermissionAction(role.id, module, action);
			if (!result.success) toast.error(result.error);
		});
	};

	return { role, updateRole, togglePermission, isPending };
}
