"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "@/lib/toast";
import type { Contact } from "@/types";
import {
	createContactAction,
	removeContactAction,
	updateContactAction,
} from "../actions";
import type { ContactFormValues } from "../components/contact-form-schema";

type ContactOptimisticAction =
	| { type: "add"; contact: Contact }
	| { type: "update"; id: string; patch: ContactFormValues }
	| { type: "remove"; id: string };

function contactsReducer(
	state: Contact[],
	action: ContactOptimisticAction,
): Contact[] {
	switch (action.type) {
		case "add":
			return [...state, action.contact];
		case "update":
			return state.map((contact) =>
				contact.id === action.id ? { ...contact, ...action.patch } : contact,
			);
		case "remove":
			return state.filter((contact) => contact.id !== action.id);
	}
}

/**
 * Controlador del módulo Contactos: envuelve las Server Actions (`../actions`) con estado
 * optimista (`useOptimistic`) para que la UI responda al instante mientras la mutación real
 * corre contra la base de datos. `initialContacts` viene del Server Component
 * (`app/(app)/contactos/page.tsx`); tras cada mutación exitosa, `revalidatePath` en la Server
 * Action refresca ese valor y `useOptimistic` reconcilia automáticamente.
 */
export function useContactsController(initialContacts: Contact[]) {
	const [isPending, startTransition] = useTransition();
	const [contacts, applyOptimistic] = useOptimistic(
		initialContacts,
		contactsReducer,
	);

	const addContact = (values: ContactFormValues) => {
		startTransition(async () => {
			applyOptimistic({
				type: "add",
				contact: { ...values, id: crypto.randomUUID() },
			});
			await toast
				.promise(
					(async () => {
						const result = await createContactAction(values);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Creando contacto...",
						success: "Contacto creado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo crear el contacto.",
					},
				)
				.catch(() => {});
		});
	};

	const updateContact = (id: string, patch: ContactFormValues) => {
		startTransition(async () => {
			applyOptimistic({ type: "update", id, patch });
			await toast
				.promise(
					(async () => {
						const result = await updateContactAction(id, patch);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Actualizando contacto...",
						success: "Contacto actualizado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo actualizar el contacto.",
					},
				)
				.catch(() => {});
		});
	};

	const removeContact = (id: string) => {
		startTransition(async () => {
			applyOptimistic({ type: "remove", id });
			await toast
				.promise(
					(async () => {
						const result = await removeContactAction(id);
						if (!result.success) throw new Error(result.error);
					})(),
					{
						loading: "Eliminando contacto...",
						success: "Contacto eliminado.",
						error: (err) =>
							err instanceof Error
								? err.message
								: "No se pudo eliminar el contacto.",
					},
				)
				.catch(() => {});
		});
	};

	return { contacts, addContact, updateContact, removeContact, isPending };
}
