import { z } from "zod";

const expenseStatusValues = ["pagado", "pendiente", "anulado"] as const;
export const expenseTypeValues = [
	"fijo",
	"variable",
	"recurrente",
	"extraordinario",
] as const;

export const EXPENSE_STATUS_LABELS: Record<
	(typeof expenseStatusValues)[number],
	string
> = {
	pagado: "Pagado",
	pendiente: "Pendiente",
	anulado: "Anulado",
};

export const EXPENSE_TYPE_LABELS: Record<
	(typeof expenseTypeValues)[number],
	string
> = {
	fijo: "Fijo",
	variable: "Variable",
	recurrente: "Recurrente",
	extraordinario: "Extraordinario",
};

export const expenseFormSchema = z.object({
	date: z.string().min(1, "La fecha es obligatoria"),
	amount: z.coerce.number().positive("Debe ser mayor a 0"),
	categoryId: z.string().min(1, "Selecciona una categoría"),
	description: z.string().min(1, "La descripción es obligatoria"),
	supplier: z.string().optional(),
	paymentMethod: z.string().min(1, "El método de pago es obligatorio"),
	invoiceRef: z.string().optional(),
	type: z.enum(expenseTypeValues),
	status: z.enum(["pagado", "pendiente"]),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseCategoryFormSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	parentId: z.string().optional(),
});

export type ExpenseCategoryFormValues = z.infer<
	typeof expenseCategoryFormSchema
>;
