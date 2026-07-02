"use client";

import { useContactStore } from "@/stores/contact-store";

export function useContacts() {
	return useContactStore((state) => state.contacts);
}

export function useContactMutations() {
	const addContact = useContactStore((state) => state.addContact);
	const updateContact = useContactStore((state) => state.updateContact);
	const removeContact = useContactStore((state) => state.removeContact);
	return { addContact, updateContact, removeContact };
}
