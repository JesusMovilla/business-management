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
import { useCategoryMutations } from "../hooks/use-products";

export function CategoryFormDialog({
	onCreated,
}: {
	onCreated: (categoryId: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const { addCategory } = useCategoryMutations();

	const handleSubmit = async () => {
		if (!name.trim()) return;
		const id = await addCategory({ name: name.trim() });
		if (!id) return;
		onCreated(id);
		setName("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button variant="outline" size="sm" type="button" />}
			>
				Nueva categoría
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nueva categoría</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="new-category-name">Nombre</Label>
					<Input
						id="new-category-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Ej. Cerveza"
					/>
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
