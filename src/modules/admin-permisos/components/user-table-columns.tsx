"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Role, User } from "@/types";

interface BuildUserColumnsArgs {
	roles: Role[];
	onRoleChange: (userId: string, roleId: string) => void;
	onActiveChange: (userId: string, active: boolean) => void;
}

export function buildUserColumns({
	roles,
	onRoleChange,
	onActiveChange,
}: BuildUserColumnsArgs): ColumnDef<User>[] {
	return [
		{
			accessorKey: "fullName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Nombre" />
			),
			meta: { title: "Nombre" },
			cell: ({ row }) => (
				<span className="font-medium">{row.original.fullName}</span>
			),
		},
		{
			accessorKey: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Email" />
			),
			meta: { title: "Email" },
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.email}</span>
			),
		},
		{
			id: "role",
			header: "Rol",
			enableSorting: false,
			cell: ({ row }) => (
				<Select
					value={row.original.roleId}
					onValueChange={(value) =>
						onRoleChange(row.original.id, value as string)
					}
				>
					<SelectTrigger size="sm" className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{roles.map((role) => (
							<SelectItem key={role.id} value={role.id}>
								{role.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			),
		},
		{
			id: "active",
			header: "Activo",
			enableSorting: false,
			cell: ({ row }) => (
				<Switch
					checked={row.original.active}
					onCheckedChange={(checked) =>
						onActiveChange(row.original.id, checked)
					}
				/>
			),
		},
	];
}
