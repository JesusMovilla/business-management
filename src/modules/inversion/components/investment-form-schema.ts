import { z } from "zod";

export const investmentGroupStatusValues = ["activo", "inactivo"] as const;

export const INVESTMENT_GROUP_STATUS_LABELS: Record<
	(typeof investmentGroupStatusValues)[number],
	string
> = {
	activo: "Activo",
	inactivo: "Inactivo",
};

export const investmentGroupFormSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	status: z.enum(investmentGroupStatusValues),
	memberUserIds: z
		.array(z.string())
		.min(1, "Selecciona al menos un integrante"),
});

export type InvestmentGroupFormValues = z.infer<
	typeof investmentGroupFormSchema
>;

const investmentStatusValues = ["activa", "anulada"] as const;

export const INVESTMENT_STATUS_LABELS: Record<
	(typeof investmentStatusValues)[number],
	string
> = {
	activa: "Activa",
	anulada: "Anulada",
};

export const investmentFormSchema = z.object({
	date: z.string().min(1, "La fecha es obligatoria"),
	amount: z.coerce.number().positive("Debe ser mayor a 0"),
	groupId: z.string().min(1, "Selecciona un grupo"),
	description: z.string().min(1, "La descripción es obligatoria"),
});

export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;
