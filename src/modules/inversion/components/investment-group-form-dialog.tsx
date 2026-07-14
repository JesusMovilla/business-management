"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
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
import type { InvestmentGroup, User } from "@/types";
import {
	INVESTMENT_GROUP_STATUS_LABELS,
	type InvestmentGroupFormValues,
	investmentGroupStatusValues,
} from "./investment-form-schema";

interface InvestmentGroupFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa, el diálogo edita ese grupo; si no, crea uno nuevo. */
	group?: InvestmentGroup | null;
	users: User[];
	onSubmit: (values: InvestmentGroupFormValues) => void;
}

/** Igual que `ExpenseFormDialog`: móntalo con una `key` que cambie en cada apertura. */
export function InvestmentGroupFormDialog({
	open,
	onOpenChange,
	group,
	users,
	onSubmit,
}: InvestmentGroupFormDialogProps) {
	const [name, setName] = useState(group?.name ?? "");
	const [status, setStatus] = useState<InvestmentGroupFormValues["status"]>(
		group?.status ?? "activo",
	);
	const [memberUserIds, setMemberUserIds] = useState<string[]>(
		group?.memberUserIds ?? [],
	);
	const memberUserIdSet = useMemo(
		() => new Set(memberUserIds),
		[memberUserIds],
	);
	const [error, setError] = useState<string | null>(null);

	const toggleMember = (userId: string, checked: boolean) => {
		setMemberUserIds((prev) =>
			checked ? [...prev, userId] : prev.filter((id) => id !== userId),
		);
	};

	const handleSubmit = () => {
		if (!name.trim()) {
			setError("El nombre es obligatorio.");
			return;
		}
		if (memberUserIds.length === 0) {
			setError("Selecciona al menos un integrante.");
			return;
		}
		setError(null);
		onSubmit({ name: name.trim(), status, memberUserIds });
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{group ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="group-name">Nombre</Label>
						<Input
							id="group-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Ej: Grupo A"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Estado</Label>
						<Select
							value={status}
							onValueChange={(value) =>
								setStatus(
									(value ?? "activo") as InvestmentGroupFormValues["status"],
								)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{investmentGroupStatusValues.map((value) => (
									<SelectItem key={value} value={value}>
										{INVESTMENT_GROUP_STATUS_LABELS[value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Integrantes (usuarios del sistema)</Label>
						<div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
							{users.length === 0 && (
								<p className="text-muted-foreground text-sm">
									No hay usuarios disponibles.
								</p>
							)}
							{users.map((user) => (
								<label
									key={user.id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
								>
									<input
										type="checkbox"
										className="size-4 rounded border-input"
										checked={memberUserIdSet.has(user.id)}
										onChange={(event) =>
											toggleMember(user.id, event.target.checked)
										}
									/>
									<span>{user.fullName}</span>
									<span className="text-muted-foreground text-xs">
										{user.email}
									</span>
								</label>
							))}
						</div>
					</div>
					{error && <p className="text-destructive text-sm">{error}</p>}
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit}>
						{group ? "Guardar" : "Crear"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
