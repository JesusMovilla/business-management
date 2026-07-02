import { RoleForm } from "@/modules/admin-permisos/components/role-form";

export default function NuevoRolPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Nuevo rol</h1>
				<p className="text-muted-foreground text-sm">
					Crea un rol y luego ajusta sus permisos desde la matriz de módulos.
				</p>
			</div>
			<RoleForm mode="create" />
		</div>
	);
}
