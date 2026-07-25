import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { roleRepository } from "@/data/repositories/role-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { RoleTable } from "@/modules/admin-permisos/components/role-table";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
	const [roles, users] = await Promise.all([
		roleRepository.list(),
		userRepository.list(),
	]);

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Roles"
				description="Define roles personalizados y su matriz de permisos."
				backHref="/admin"
				actions={
					<>
						<Button variant="outline" render={<Link href="/admin/usuarios" />}>
							<Users className="size-4" />
							Usuarios
						</Button>
						<Button render={<Link href="/admin/roles/nuevo" />}>
							<Plus className="size-4" />
							Nuevo rol
						</Button>
					</>
				}
			/>
			<RoleTable initialRoles={roles} users={users} />
		</div>
	);
}
