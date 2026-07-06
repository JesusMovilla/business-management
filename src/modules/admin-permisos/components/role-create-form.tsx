"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import type { AppModule, PermissionAction, PermissionTree } from "@/types";
import { buildEmptyPermissionTree, togglePermissionEntry } from "@/types";
import { createRoleAction } from "../actions";
import { PermissionTreeEditor } from "./permission-tree";

export function RoleCreateForm() {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [permissions, setPermissions] = useState<PermissionTree>(() =>
		buildEmptyPermissionTree(),
	);

	const handleToggle = (module: AppModule, action: PermissionAction) => {
		setPermissions((prev) => togglePermissionEntry(prev, module, action));
	};

	const hasAnyPermission = permissions.some((entry) =>
		Object.values(entry.actions).some(Boolean),
	);

	const handleSubmit = () => {
		if (!name.trim()) {
			toast.error("El nombre del rol es obligatorio.");
			return;
		}
		if (!hasAnyPermission) {
			toast.error("Selecciona al menos un permiso antes de crear el rol.");
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
		<div className="flex flex-col gap-6 pb-20">
			<Card>
				<CardContent className="flex flex-col gap-3.5">
					<div className="flex flex-col gap-2">
						<Label htmlFor="role-name">Nombre del rol</Label>
						<Input
							id="role-name"
							placeholder="Ej. Vendedor"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="role-description">Descripción</Label>
						<Textarea
							id="role-description"
							placeholder="¿Para qué se usa este rol?"
							rows={2}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-col gap-2">
				<Label>Permisos por módulo</Label>
				<PermissionTreeEditor
					permissions={permissions}
					onToggle={handleToggle}
				/>
			</div>

			<div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t bg-card px-4 py-3.5 sm:px-6 md:left-64">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/admin/roles")}
				>
					Cancelar
				</Button>
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isPending || !hasAnyPermission}
				>
					Crear rol
				</Button>
			</div>
		</div>
	);
}
