import { roleRepository } from "@/data/repositories/role-repository";
import { RoleEdit } from "@/modules/admin-permisos/components/role-edit";

export const dynamic = "force-dynamic";

export default async function EditarRolPage({
	params,
}: {
	params: Promise<{ roleId: string }>;
}) {
	const { roleId } = await params;
	const role = await roleRepository.getById(roleId);
	return <RoleEdit role={role} />;
}
