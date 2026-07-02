"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRole } from "../hooks/use-roles";
import { RoleForm } from "./role-form";

export function RoleEdit({ roleId }: { roleId: string }) {
	const role = useRole(roleId);

	if (!role) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-center">
				<p className="text-muted-foreground">
					No se encontró el rol solicitado.
				</p>
				<Button render={<Link href="/admin/roles" />}>Volver a roles</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Editar rol: {role.name}</h1>
				<p className="text-muted-foreground text-sm">
					Los cambios en la matriz de permisos se guardan al instante.
				</p>
			</div>
			<RoleForm mode="edit" role={role} />
		</div>
	);
}
