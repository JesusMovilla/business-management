"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { useRbacMutations, useRoles, useUsers } from "../hooks/use-roles";
import { buildUserColumns } from "./user-table-columns";

export function UserTable() {
	const users = useUsers();
	const roles = useRoles();
	const { assignRoleToUser, setUserActive } = useRbacMutations();

	const columns = useMemo(
		() =>
			buildUserColumns({
				roles,
				onRoleChange: assignRoleToUser,
				onActiveChange: setUserActive,
			}),
		[roles, assignRoleToUser, setUserActive],
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
