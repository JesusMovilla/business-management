"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { roleRepository } from "@/data/repositories/role-repository";
import { userRepository } from "@/data/repositories/user-repository";
import { toActionErrorMessage } from "@/lib/action-error";
import { checkPermission } from "@/lib/rbac/require-permission";
import type { PermissionTree } from "@/types";

export type RoleActionResult =
	| { success: true }
	| { success: false; error: string };

export async function createRoleAction(input: {
	name: string;
	description?: string;
	permissions: PermissionTree;
}): Promise<RoleActionResult> {
	const authz = await checkPermission("admin", "crear");
	if (authz) return { success: false, error: authz.error };

	if (!input.name.trim()) {
		return { success: false, error: "El nombre del rol es obligatorio." };
	}
	await roleRepository.create(input);
	revalidatePath("/admin/roles");
	return { success: true };
}

export async function updateRoleAction(
	id: string,
	patch: { name: string; description?: string; permissions?: PermissionTree },
): Promise<RoleActionResult> {
	const authz = await checkPermission("admin", "editar");
	if (authz) return { success: false, error: authz.error };

	if (!patch.name.trim()) {
		return { success: false, error: "El nombre del rol es obligatorio." };
	}
	await roleRepository.update(id, patch);
	revalidatePath("/admin/roles");
	revalidatePath(`/admin/roles/${id}`);
	return { success: true };
}

export async function deleteRoleAction(id: string): Promise<RoleActionResult> {
	const authz = await checkPermission("admin", "eliminar");
	if (authz) return { success: false, error: authz.error };

	try {
		await roleRepository.remove(id);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo eliminar el rol.",
				fk: "No se puede eliminar: hay usuarios con este rol asignado.",
			}),
		};
	}
	revalidatePath("/admin/roles");
	return { success: true };
}

export type UserActionResult =
	| { success: true }
	| { success: false; error: string };

export async function assignRolesBatchAction(
	assignments: { userId: string; roleId: string }[],
): Promise<UserActionResult> {
	const authz = await checkPermission("admin", "editar");
	if (authz) return { success: false, error: authz.error };

	if (assignments.length === 0) return { success: true };

	await userRepository.assignRolesBatch(assignments);
	revalidatePath("/admin/usuarios");
	return { success: true };
}

export async function setUserActiveAction(
	userId: string,
	active: boolean,
): Promise<UserActionResult> {
	const authz = await checkPermission("admin", "editar");
	if (authz) return { success: false, error: authz.error };

	await userRepository.setActive(userId, active);
	revalidatePath("/admin/usuarios");
	return { success: true };
}

export type CreateUserActionResult =
	| { success: true; password: string }
	| { success: false; error: string };

function generateTempPassword(): string {
	return randomBytes(9).toString("base64url");
}

export async function createUserAction(input: {
	fullName: string;
	email: string;
	roleId: string;
}): Promise<CreateUserActionResult> {
	const authz = await checkPermission("admin", "crear");
	if (authz) return { success: false, error: authz.error };

	if (!input.fullName.trim() || !input.email.trim() || !input.roleId) {
		return { success: false, error: "Nombre, email y rol son obligatorios." };
	}

	const password = generateTempPassword();
	try {
		await userRepository.create({
			fullName: input.fullName.trim(),
			email: input.email.trim(),
			roleId: input.roleId,
			password,
		});
	} catch {
		return {
			success: false,
			error: "No se pudo crear el usuario (¿el email ya está en uso?).",
		};
	}
	revalidatePath("/admin/usuarios");
	return { success: true, password };
}
