import { z } from "zod";

const profitPayoutStatusValues = ["activo", "anulado"] as const;

export const PROFIT_PAYOUT_STATUS_LABELS: Record<
	(typeof profitPayoutStatusValues)[number],
	string
> = {
	activo: "Activo",
	anulado: "Anulado",
};

export const profitPayoutFormSchema = z.object({
	date: z.string().min(1, "La fecha es obligatoria"),
	amount: z.coerce.number().positive("Debe ser mayor a 0"),
	groupId: z.string().min(1, "Selecciona un grupo"),
	note: z.string().min(1, "Indica a qué período corresponde el pago"),
});

export type ProfitPayoutFormValues = z.infer<typeof profitPayoutFormSchema>;
