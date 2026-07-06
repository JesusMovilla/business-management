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
import { useSupplierMutations } from "../hooks/use-products";

export function SupplierFormDialog({
	onCreated,
}: {
	onCreated: (supplierId: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [contactName, setContactName] = useState("");
	const [phone, setPhone] = useState("");
	const { addSupplier } = useSupplierMutations();

	const handleSubmit = async () => {
		if (!name.trim()) return;
		const id = await addSupplier({
			name: name.trim(),
			contactName: contactName.trim(),
			phone: phone.trim(),
		});
		if (!id) return;
		onCreated(id);
		setName("");
		setContactName("");
		setPhone("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={<Button variant="outline" size="sm" type="button" />}
			>
				Nuevo proveedor
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nuevo proveedor</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2">
						<Label htmlFor="new-supplier-name">Nombre</Label>
						<Input
							id="new-supplier-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="new-supplier-contact">Contacto</Label>
						<Input
							id="new-supplier-contact"
							value={contactName}
							onChange={(e) => setContactName(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="new-supplier-phone">Teléfono</Label>
						<Input
							id="new-supplier-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
						/>
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
