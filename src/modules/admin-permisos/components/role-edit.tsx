import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types";
import { RoleEditForm } from "./role-edit-form";

export function RoleEdit({ role }: { role: Role | undefined }) {
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
				<div className="flex flex-wrap items-center gap-2.5">
					<h1 className="text-2xl font-semibold">Editar rol: {role.name}</h1>
					{role.isSystem && (
						<Badge variant="secondary">
							<ShieldCheck data-icon="inline-start" /> Rol de sistema
						</Badge>
					)}
				</div>
				<p className="text-muted-foreground text-sm">
					{role.isSystem
						? "Este rol tiene acceso total y no puede modificarse."
						: "Los cambios en la matriz de permisos se guardan al instante."}
				</p>
			</div>
			<RoleEditForm key={role.id} role={role} />
		</div>
	);
}
