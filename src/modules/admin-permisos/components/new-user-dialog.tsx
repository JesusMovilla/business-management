"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { Role } from "@/types";
import { createUserAction } from "../actions";

const EMPTY_FORM = { fullName: "", email: "", roleId: "" };

interface NewUserDialogProps {
	roles: Role[];
}

/**
 * Botón + diálogo para dar de alta un usuario nuevo. El admin no inventa una contraseña: se
 * genera una temporal server-side y se muestra una sola vez al terminar, para copiar y entregar
 * al usuario (que la cambia luego desde su propio menú de cuenta).
 */
export function NewUserDialog({ roles }: NewUserDialogProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [form, setForm] = useState(EMPTY_FORM);
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(
		null,
	);

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			setForm(EMPTY_FORM);
			setGeneratedPassword(null);
		}
	};

	const handleSubmit = () => {
		if (!form.fullName.trim() || !form.email.trim() || !form.roleId) {
			toast.error("Completa nombre, email y rol.");
			return;
		}
		startTransition(async () => {
			const result = await createUserAction(form);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			setGeneratedPassword(result.password);
		});
	};

	return (
		<>
			<Button type="button" size="sm" onClick={() => setOpen(true)}>
				<Plus className="size-4" />
				Nuevo usuario
			</Button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent>
					{generatedPassword ? (
						<>
							<DialogHeader>
								<DialogTitle>Usuario creado</DialogTitle>
								<DialogDescription>
									Copia esta contraseña temporal ahora — no se vuelve a mostrar.
									El usuario puede cambiarla luego desde su menú de cuenta.
								</DialogDescription>
							</DialogHeader>
							<code className="break-all rounded-md bg-muted px-3 py-2 text-sm">
								{generatedPassword}
							</code>
							<DialogFooter>
								<Button type="button" onClick={() => handleOpenChange(false)}>
									Listo
								</Button>
							</DialogFooter>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle>Nuevo usuario</DialogTitle>
							</DialogHeader>
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-2">
									<Label htmlFor="user-name">Nombre completo</Label>
									<Input
										id="user-name"
										value={form.fullName}
										onChange={(event) =>
											setForm((prev) => ({
												...prev,
												fullName: event.target.value,
											}))
										}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="user-email">Email</Label>
									<Input
										id="user-email"
										type="email"
										value={form.email}
										onChange={(event) =>
											setForm((prev) => ({
												...prev,
												email: event.target.value,
											}))
										}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label htmlFor="user-role">Rol</Label>
									<Select
										value={form.roleId}
										onValueChange={(value) =>
											value && setForm((prev) => ({ ...prev, roleId: value }))
										}
									>
										<SelectTrigger id="user-role">
											<SelectValue placeholder="Selecciona un rol" />
										</SelectTrigger>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem key={role.id} value={role.id}>
													{role.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									onClick={handleSubmit}
									disabled={isPending}
								>
									Crear
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
