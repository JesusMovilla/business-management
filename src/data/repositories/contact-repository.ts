import { useContactStore } from "@/stores/contact-store";
import type { Contact } from "@/types";

export const contactRepository = {
	async list(): Promise<Contact[]> {
		return useContactStore.getState().contacts;
	},
	async create(input: Omit<Contact, "id">): Promise<string> {
		return useContactStore.getState().addContact(input);
	},
	async update(id: string, patch: Partial<Omit<Contact, "id">>): Promise<void> {
		useContactStore.getState().updateContact(id, patch);
	},
	async remove(id: string): Promise<void> {
		useContactStore.getState().removeContact(id);
	},
};
