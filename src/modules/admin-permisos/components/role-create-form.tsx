"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { AppModule, PermissionAction, PermissionTree } from "@/types";
import { buildEmptyPermissionTree } from "@/types";
import { createRoleAction } from "../actions";
import { PermissionTreeEditor } from "./permission-tree";

export function RoleCreateForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [permissions, setPermissions] = useState<PermissionTree>(
		buildEmptyPermissionTree(),
	);

	const handleToggle = (module: AppModule, action: PermissionAction) => {
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
		startTransition(async () => {
			const result = await createRoleAction({
				name: name.trim(),
				description: description.trim() || undefined,
				permissions,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success("Rol creado.");
			router.push("/admin/roles");
		});
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
					permissions={permissions}
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
				<Button type="button" onClick={handleSubmit} disabled={isPending}>
					Crear rol
				</Button>
			</div>
		</div>
	);
}
