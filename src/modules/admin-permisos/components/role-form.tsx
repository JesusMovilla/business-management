"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type {
	AppModule,
	PermissionAction,
	PermissionTree,
	Role,
} from "@/types";
import { buildEmptyPermissionTree } from "@/types";
import { useRbacMutations } from "../hooks/use-roles";
import { PermissionTreeEditor } from "./permission-tree";

interface RoleFormProps {
	mode: "create" | "edit";
	role?: Role;
}

export function RoleForm({ mode, role }: RoleFormProps) {
	const router = useRouter();
	const { createRole, updateRole, togglePermission } = useRbacMutations();
	const [name, setName] = useState(role?.name ?? "");
	const [description, setDescription] = useState(role?.description ?? "");
	const [permissions, setPermissions] = useState<PermissionTree>(
		role?.permissions ?? buildEmptyPermissionTree(),
	);
	const [roleId] = useState(role?.id);

	const handleToggle = (module: AppModule, action: PermissionAction) => {
		if (mode === "edit" && roleId) {
			togglePermission(roleId, module, action);
			return;
		}
		setPermissions((prev) =>
			prev.map((entry) => {
				if (entry.module !== module) return entry;
				const nextValue = !entry.actions[action];
				const actions = { ...entry.actions, [action]: nextValue };
				if (action === "ver" && !nextValue) {
					actions.crear = false;
					actions.editar = false;
					actions.eliminar = false;
				}
				if (action !== "ver" && nextValue) actions.ver = true;
				return { ...entry, actions };
			}),
		);
	};

	const handleSubmit = () => {
		if (!name.trim()) {
			toast.error("El nombre del rol es obligatorio.");
			return;
		}
		if (mode === "create") {
			createRole({
				name: name.trim(),
				description: description.trim() || undefined,
			});
			toast.success("Rol creado. Ahora puedes ajustar sus permisos.");
		} else if (roleId) {
			updateRole(roleId, {
				name: name.trim(),
				description: description.trim() || undefined,
			});
			toast.success("Rol actualizado.");
		}
		router.push("/admin/roles");
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="flex flex-col gap-2">
					<Label htmlFor="role-name">Nombre del rol</Label>
					<Input
						id="role-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						disabled={role?.isSystem}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="role-description">Descripción</Label>
					<Textarea
						id="role-description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<Label>Permisos por módulo</Label>
				<PermissionTreeEditor
					permissions={mode === "edit" && role ? role.permissions : permissions}
					onToggle={handleToggle}
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/roles")}
				>
					Cancelar
				</Button>
				<Button type="button" onClick={handleSubmit}>
					{mode === "create" ? "Crear rol" : "Guardar nombre y descripción"}
				</Button>
			</div>
		</div>
	);
}
