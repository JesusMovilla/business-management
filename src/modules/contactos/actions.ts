"use server";

import { revalidatePath } from "next/cache";
import { contactRepository } from "@/data/repositories/contact-repository";
import { toActionErrorMessage } from "@/lib/action-error";
import { checkPermission } from "@/lib/rbac/require-permission";
import { contactFormSchema } from "./components/contact-form-schema";

export type ContactActionResult =
	| { success: true }
	| { success: false; error: string };

function firstIssueMessage(error: { issues: { message: string }[] }): string {
	return error.issues[0]?.message ?? "Datos inválidos.";
}

export async function createContactAction(
	input: unknown,
): Promise<ContactActionResult> {
	const authz = await checkPermission("contactos", "crear");
	if (authz) return { success: false, error: authz.error };

	const parsed = contactFormSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) };
	}
	await contactRepository.create(parsed.data);
	revalidatePath("/contactos");
	return { success: true };
}

export async function updateContactAction(
	id: string,
	input: unknown,
): Promise<ContactActionResult> {
	const authz = await checkPermission("contactos", "editar");
	if (authz) return { success: false, error: authz.error };

	const parsed = contactFormSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: firstIssueMessage(parsed.error) };
	}
	await contactRepository.update(id, parsed.data);
	revalidatePath("/contactos");
	return { success: true };
}

export async function removeContactAction(
	id: string,
): Promise<ContactActionResult> {
	const authz = await checkPermission("contactos", "eliminar");
	if (authz) return { success: false, error: authz.error };

	try {
		await contactRepository.remove(id);
	} catch (err) {
		return {
			success: false,
			error: toActionErrorMessage(err, {
				fallback: "No se pudo eliminar el contacto.",
			}),
		};
	}
	revalidatePath("/contactos");
	return { success: true };
}
