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
import { toast } from "@/lib/toast";
import { useCategoryMutations } from "../hooks/use-products";

export function CategoryFormDialog({
	onCreated,
}: {
	onCreated: (categoryId: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { addCategory } = useCategoryMutations();

	const handleSubmit = async () => {
		if (!name.trim()) return;
		setIsSubmitting(true);
		try {
			const id = await toast.promise(addCategory({ name: name.trim() }), {
				loading: "Creando categoría...",
				success: "Categoría creada.",
				error: (err) =>
					err instanceof Error ? err.message : "No se pudo crear la categoría.",
			});
			onCreated(id);
			setName("");
			setOpen(false);
		} catch {
			// El toast ya mostró el error.
		} finally {
			setIsSubmitting(false);
		}
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
						disabled={isSubmitting}
					/>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
						Crear
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
