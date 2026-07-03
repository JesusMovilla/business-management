import { z } from "zod";

export const contactFormSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	phone: z.string().min(1, "El teléfono es obligatorio"),
	description: z.string(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
