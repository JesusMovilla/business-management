import { Plus } from "lucide-react";
import Link from "next/link";
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
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Roles</h1>
					<p className="text-muted-foreground text-sm">
						Define roles personalizados y su matriz de permisos.
					</p>
				</div>
				<Button render={<Link href="/admin/roles/nuevo" />}>
					<Plus className="size-4" />
					Nuevo rol
				</Button>
			</div>
			<RoleTable initialRoles={roles} users={users} />
		</div>
	);
}
