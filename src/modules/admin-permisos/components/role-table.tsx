"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRbacMutations, useRoles, useUsers } from "../hooks/use-roles";

export function RoleTable() {
	const roles = useRoles();
	const users = useUsers();
	const { deleteRole } = useRbacMutations();

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Descripción</TableHead>
						<TableHead>Usuarios</TableHead>
						<TableHead className="w-24" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{roles.map((role) => {
						const userCount = users.filter(
							(user) => user.roleId === role.id,
						).length;
						return (
							<TableRow key={role.id}>
								<TableCell className="font-medium">
									<Link
										href={`/admin/roles/${role.id}`}
										className="hover:underline"
									>
										{role.name}
									</Link>
									{role.isSystem && (
										<Badge variant="secondary" className="ml-2">
											Sistema
										</Badge>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{role.description ?? "—"}
								</TableCell>
								<TableCell>{userCount}</TableCell>
								<TableCell>
									{!role.isSystem && (
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => deleteRole(role.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
