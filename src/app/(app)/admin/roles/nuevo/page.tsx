import { PageHeader } from "@/components/layout/page-header";
import { RoleCreateForm } from "@/modules/admin-permisos/components/role-create-form";

export default function NuevoRolPage() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Nuevo rol"
				description="Crea un rol y ajusta sus permisos antes de guardarlo."
				backHref="/admin/roles"
			/>
			<RoleCreateForm />
		</div>
	);
}
