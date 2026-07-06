"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { User } from "@/types";
import { assignRolesBatchAction, setUserActiveAction } from "../actions";

type UserOptimisticAction = {
	type: "setActive";
	userId: string;
	active: boolean;
};

function usersReducer(state: User[], action: UserOptimisticAction): User[] {
	return state.map((user) =>
		user.id === action.userId ? { ...user, active: action.active } : user,
	);
}

/**
 * El cambio de "activo" se guarda al instante (optimista). El cambio de rol, en cambio, se
 * junta en `pendingRoles` y solo se persiste al llamar `saveRoleChanges` — así una reasignación
 * masiva dispara una sola transacción en vez de una mutación por usuario (ver docs/RBAC.md).
 */
export function useUsersController(initialUsers: User[]) {
	const [isPending, startTransition] = useTransition();
	const [users, applyOptimistic] = useOptimistic(initialUsers, usersReducer);
	const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

	const setActive = (userId: string, active: boolean) => {
		startTransition(async () => {
			applyOptimistic({ type: "setActive", userId, active });
			await toast
				.promise(
					(async () => {
						const result = await setUserActiveAction(userId, active);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: active
							? "Activando usuario..."
							: "Desactivando usuario...",
						success: active ? "Usuario activado." : "Usuario desactivado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el usuario.",
					},
				)
				.catch(() => {});
		});
	};

	const setPendingRole = (userId: string, roleId: string) => {
		const original = initialUsers.find((u) => u.id === userId)?.roleId;
		setPendingRoles((prev) => {
			const next = { ...prev };
			if (roleId === original) delete next[userId];
			else next[userId] = roleId;
			return next;
		});
	};

	const discardRoleChanges = () => setPendingRoles({});

	const hasPendingRoleChanges = Object.keys(pendingRoles).length > 0;

	const saveRoleChanges = () => {
		if (!hasPendingRoleChanges) return;
		const assignments = Object.entries(pendingRoles).map(
			([userId, roleId]) => ({
				userId,
				roleId,
			}),
		);
		startTransition(async () => {
			const result = await toast
				.promise(
					(async () => {
						const actionResult = await assignRolesBatchAction(assignments);
						if (!actionResult.success) throw new Error(actionResult.error);
					})(),
					{
						loading: "Guardando roles...",
						success: "Roles actualizados.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudieron actualizar los roles.",
					},
				)
				.then(() => true)
				.catch(() => false);
			if (result) setPendingRoles({});
		});
	};

	const usersWithPendingRoles = useMemo(
		() =>
			users.map((user) =>
				pendingRoles[user.id]
					? { ...user, roleId: pendingRoles[user.id] }
					: user,
			),
		[users, pendingRoles],
	);

	return {
		users: usersWithPendingRoles,
		setActive,
		pendingRoles,
		setPendingRole,
		hasPendingRoleChanges,
		saveRoleChanges,
		discardRoleChanges,
		isPending,
	};
}
