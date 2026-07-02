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
import { toast } from "@/lib/toast";
import type { Contact } from "@/types";
import { useContactMutations, useContacts } from "../hooks/use-contacts";
import { ContactFormDialog } from "./contact-form-dialog";
import { buildContactColumns } from "./contact-table-columns";

const globalFilterFn: FilterFn<Contact> = (row, _columnId, value) => {
	const search = String(value).toLowerCase();
	const { name, phone, description } = row.original;
	return `${name} ${phone} ${description}`.toLowerCase().includes(search);
};

export function ContactTable() {
	const contacts = useContacts();
	const { addContact, updateContact, removeContact } = useContactMutations();

	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);
	const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

	const columns = useMemo(
		() =>
			buildContactColumns({
				onEdit: (contact) => {
					setEditingContact(contact);
					setFormOpen(true);
				},
				onDelete: setContactToDelete,
			}),
		[],
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
							onClick={() => {
								setEditingContact(null);
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
				open={formOpen}
				onOpenChange={setFormOpen}
				contact={editingContact}
				onSubmit={(values) => {
					if (editingContact) {
						updateContact(editingContact.id, values);
						toast.success("Contacto actualizado.");
					} else {
						addContact(values);
						toast.success("Contacto creado.");
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
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (contactToDelete) {
									removeContact(contactToDelete.id);
									toast.success("Contacto eliminado.");
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
