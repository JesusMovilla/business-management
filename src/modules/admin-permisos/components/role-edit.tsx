import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
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
			<PageHeader
				title={`Editar rol: ${role.name}`}
				description={
					role.isSystem
						? "Este rol tiene acceso total y no puede modificarse."
						: 'Ajusta la matriz de permisos y presiona "Guardar rol" para confirmar los cambios.'
				}
				badge={
					role.isSystem && (
						<Badge variant="secondary">
							<ShieldCheck data-icon="inline-start" /> Rol de sistema
						</Badge>
					)
				}
				backHref="/admin/roles"
			/>
			<RoleEditForm key={role.id} role={role} />
		</div>
	);
}
