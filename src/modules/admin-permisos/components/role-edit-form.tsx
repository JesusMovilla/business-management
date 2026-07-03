"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { Role } from "@/types";
import { useRoleEditController } from "../hooks/use-roles";
import { PermissionTreeEditor } from "./permission-tree";

export function RoleEditForm({ role: initialRole }: { role: Role }) {
	const router = useRouter();
	const { role, updateRole, togglePermission } =
		useRoleEditController(initialRole);
	const [name, setName] = useState(initialRole.name);
	const [description, setDescription] = useState(initialRole.description ?? "");

	const handleSave = () => {
		if (!name.trim()) {
			toast.error("El nombre del rol es obligatorio.");
			return;
		}
		updateRole({
			name: name.trim(),
			description: description.trim() || undefined,
		});
		toast.success("Rol actualizado.");
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
						disabled={role.isSystem}
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
					permissions={role.permissions}
					onToggle={togglePermission}
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/roles")}
				>
					Volver
				</Button>
				<Button type="button" onClick={handleSave}>
					Guardar nombre y descripción
				</Button>
			</div>
		</div>
	);
}
