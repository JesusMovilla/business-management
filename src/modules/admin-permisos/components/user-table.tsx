"use client";

import { useCallback, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { toast } from "@/lib/toast";
import { useRbacMutations, useRoles, useUsers } from "../hooks/use-roles";
import { buildUserColumns } from "./user-table-columns";

export function UserTable() {
	const users = useUsers();
	const roles = useRoles();
	const { assignRoleToUser, setUserActive } = useRbacMutations();

	const handleRoleChange = useCallback(
		(userId: string, roleId: string) => {
			assignRoleToUser(userId, roleId);
			toast.success("Rol actualizado.");
		},
		[assignRoleToUser],
	);

	const handleActiveChange = useCallback(
		(userId: string, active: boolean) => {
			setUserActive(userId, active);
			toast.success(active ? "Usuario activado." : "Usuario desactivado.");
		},
		[setUserActive],
	);

	const columns = useMemo(
		() =>
			buildUserColumns({
				roles,
				onRoleChange: handleRoleChange,
				onActiveChange: handleActiveChange,
			}),
		[roles, handleRoleChange, handleActiveChange],
	);

	return (
		<DataTable
			columns={columns}
			data={users}
			searchPlaceholder="Buscar por nombre o email..."
			emptyMessage="No hay usuarios."
		/>
	);
}
