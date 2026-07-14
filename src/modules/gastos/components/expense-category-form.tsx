"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import type { ExpenseCategory } from "@/types";

interface ExpenseCategoryFormDialogProps {
	categories: ExpenseCategory[];
	onCreated: (values: { name: string; parentId?: string }) => void;
}

const NONE_VALUE = "__none__";

export function ExpenseCategoryFormDialog({
	categories,
	onCreated,
}: ExpenseCategoryFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [parentId, setParentId] = useState(NONE_VALUE);

	const handleSubmit = () => {
		if (!name.trim()) return;
		onCreated({
			name: name.trim(),
			parentId: parentId === NONE_VALUE ? undefined : parentId,
		});
		setName("");
		setParentId(NONE_VALUE);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button size="sm" type="button" />}>
				Nueva categoría
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nueva categoría de gasto</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="new-expense-category-name">Nombre</Label>
						<Input
							id="new-expense-category-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Ej: Publicidad"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label>Categoría padre (opcional)</Label>
						<Select
							value={parentId}
							onValueChange={(value) => setParentId(value ?? NONE_VALUE)}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NONE_VALUE}>
									Ninguna (categoría principal)
								</SelectItem>
								{categories.flatMap((category) =>
									category.parentId ? (
										[]
									) : (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit}>
						Crear
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
