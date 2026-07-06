"use client";

import type { FilterFn } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/guards/permission-guard";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/types";
import { useContactsController } from "../hooks/use-contacts";
import { ContactFormDialog } from "./contact-form-dialog";
import { buildContactColumns } from "./contact-table-columns";

const globalFilterFn: FilterFn<Contact> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { name, phone, description } = row.original;
	return `${name} ${phone} ${description}`.toLowerCase().includes(search);
};

interface ContactTableProps {
	initialContacts: Contact[];
}

export function ContactTable({ initialContacts }: ContactTableProps) {
	const { contacts, addContact, updateContact, removeContact, isPending } =
		useContactsController(initialContacts);

	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);
	const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
	// Cambia en cada apertura para forzar el remount de `ContactFormDialog` (ver su JSDoc): así el
	// formulario siempre arranca desde los datos actuales de `contact`/vacío, sin un efecto de sync.
	const [formSessionId, setFormSessionId] = useState(0);

	const columns = useMemo(
		() =>
			buildContactColumns({
				onEdit: (contact) => {
					setEditingContact(contact);
					setFormSessionId((id) => id + 1);
					setFormOpen(true);
				},
				onDelete: setContactToDelete,
				isPending,
			}),
		[isPending],
	);

	return (
		<div className="flex flex-col gap-4">
			<DataTable
				columns={columns}
				data={contacts}
				searchPlaceholder="Buscar por nombre, teléfono o descripción..."
				globalFilterFn={globalFilterFn}
				emptyMessage="No hay contactos registrados."
				toolbarActions={
					<PermissionGuard module="contactos" action="crear">
						<Button
							type="button"
							size="sm"
							disabled={isPending}
							onClick={() => {
								setEditingContact(null);
								setFormSessionId((id) => id + 1);
								setFormOpen(true);
							}}
						>
							<Plus className="size-4" />
							Nuevo contacto
						</Button>
					</PermissionGuard>
				}
			/>

			<ContactFormDialog
				key={formSessionId}
				open={formOpen}
				onOpenChange={setFormOpen}
				contact={editingContact}
				isPending={isPending}
				onSubmit={(values) => {
					if (editingContact) {
						updateContact(editingContact.id, values);
					} else {
						addContact(values);
					}
				}}
			/>

			<AlertDialog
				open={!!contactToDelete}
				onOpenChange={(open) => !open && setContactToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminar contacto</AlertDialogTitle>
						<AlertDialogDescription>
							¿Seguro que quieres eliminar &quot;{contactToDelete?.name}&quot;?
							Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPending}
							onClick={() => {
								if (contactToDelete) {
									removeContact(contactToDelete.id);
								}
								setContactToDelete(null);
							}}
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
