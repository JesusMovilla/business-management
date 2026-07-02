"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useCalendarMutations } from "../hooks/use-calendar";

interface EventFormDialogProps {
	defaultDate: string;
	onCreated?: () => void;
}

/** Diálogo para crear un evento propio del negocio en el calendario. */
export function EventFormDialog({
	defaultDate,
	onCreated,
}: EventFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState(defaultDate);
	const [title, setTitle] = useState("");
	const [notes, setNotes] = useState("");
	const { addEvent } = useCalendarMutations();

	useEffect(() => {
		if (open) setDate(defaultDate);
	}, [open, defaultDate]);

	const handleSubmit = () => {
		if (!title.trim() || !date) return;
		addEvent({ date, title: title.trim(), detail: notes.trim() || undefined });
		onCreated?.();
		setTitle("");
		setNotes("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button type="button" />}>
				<Plus className="size-4" />
				Agregar evento
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nuevo evento</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2">
						<Label htmlFor="event-date">Fecha</Label>
						<Input
							id="event-date"
							type="date"
							value={date}
							onChange={(event) => setDate(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="event-title">Título</Label>
						<Input
							id="event-title"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder="Ej: Inventario físico mensual"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="event-notes">Notas (opcional)</Label>
						<Input
							id="event-notes"
							value={notes}
							onChange={(event) => setNotes(event.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit}>
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
