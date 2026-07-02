import { UserTable } from "@/modules/admin-permisos/components/user-table";

export default function AdminUsuariosPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Usuarios</h1>
				<p className="text-muted-foreground text-sm">
					Consulta los usuarios y reasigna su rol.
				</p>
			</div>
			<UserTable />
		</div>
	);
}
