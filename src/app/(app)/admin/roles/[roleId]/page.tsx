import { RoleEdit } from "@/modules/admin-permisos/components/role-edit";

export default async function EditarRolPage({
	params,
}: {
	params: Promise<{ roleId: string }>;
}) {
	const { roleId } = await params;
	return <RoleEdit roleId={roleId} />;
}
