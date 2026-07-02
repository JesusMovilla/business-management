import { create } from "zustand";
import { contactsMock } from "@/modules/contactos/mock-data/contacts.mock";
import type { Contact } from "@/types";

interface ContactState {
	contacts: Contact[];
	addContact: (input: Omit<Contact, "id">) => string;
	updateContact: (id: string, patch: Partial<Omit<Contact, "id">>) => void;
	removeContact: (id: string) => void;
}

export const useContactStore = create<ContactState>((set) => ({
	contacts: contactsMock,

	addContact: (input) => {
		const id = `con-${Math.random().toString(36).slice(2, 10)}`;
		set((state) => ({ contacts: [...state.contacts, { ...input, id }] }));
		return id;
	},

	updateContact: (id, patch) => {
		set((state) => ({
			contacts: state.contacts.map((contact) =>
				contact.id === id ? { ...contact, ...patch } : contact,
			),
		}));
	},

	removeContact: (id) => {
		set((state) => ({
			contacts: state.contacts.filter((contact) => contact.id !== id),
		}));
	},
}));
