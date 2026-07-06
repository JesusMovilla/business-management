"use client";

import { useState } from "react";
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
import type { Contact } from "@/types";

const EMPTY_FORM = { name: "", phone: "", description: "" };

interface ContactFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa, el diálogo edita ese contacto; si no, crea uno nuevo. */
	contact?: Contact | null;
	onSubmit: (values: {
		name: string;
		phone: string;
		description: string;
	}) => void;
	/** Deshabilita el botón de guardar mientras la mutación anterior sigue en curso. */
	isPending?: boolean;
}

/**
 * Diálogo de creación/edición de contacto, controlado por el padre (ver `ContactTable`).
 * Nota: el llamador debe montarlo con una `key` que cambie en cada apertura (ver `ContactTable`)
 * para que React lo remonte y reinicialice `form` a partir de `contact` — así se evita re-sincronizar
 * el formulario con un efecto cada vez que cambian `open`/`contact`.
 */
export function ContactFormDialog({
	open,
	onOpenChange,
	contact,
	onSubmit,
	isPending,
}: ContactFormDialogProps) {
	const [form, setForm] = useState(() =>
		contact
			? {
					name: contact.name,
					phone: contact.phone,
					description: contact.description,
				}
			: EMPTY_FORM,
	);

	const handleSubmit = () => {
		if (!form.name.trim() || !form.phone.trim()) return;
		onSubmit({
			name: form.name.trim(),
			phone: form.phone.trim(),
			description: form.description.trim(),
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{contact ? "Editar contacto" : "Nuevo contacto"}
					</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2">
						<Label htmlFor="contact-name">Nombre</Label>
						<Input
							id="contact-name"
							value={form.name}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, name: event.target.value }))
							}
							placeholder="Ej: Andrés Molina"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="contact-phone">Teléfono</Label>
						<Input
							id="contact-phone"
							value={form.phone}
							onChange={(event) =>
								setForm((prev) => ({ ...prev, phone: event.target.value }))
							}
							placeholder="Ej: +57 300 555 1122"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="contact-description">A qué se dedica</Label>
						<Input
							id="contact-description"
							value={form.description}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									description: event.target.value,
								}))
							}
							placeholder="Ej: Mantenimiento de mesa de billar"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit} disabled={isPending}>
						{contact ? "Guardar" : "Crear"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
