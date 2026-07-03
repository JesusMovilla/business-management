import { roleRepository } from "@/data/repositories/role-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { UserTable } from "@/modules/admin-permisos/components/user-table";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
	const [users, roles] = await Promise.all([
		userRepository.list(),
		roleRepository.list(),
	]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Usuarios</h1>
				<p className="text-muted-foreground text-sm">
					Consulta los usuarios, crea nuevos y reasigna su rol — recuerda
					guardar los cambios de rol antes de salir.
				</p>
			</div>
			<UserTable initialUsers={users} roles={roles} />
		</div>
	);
}
