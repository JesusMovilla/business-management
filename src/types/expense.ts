export type ExpenseStatus = "pagado" | "pendiente" | "anulado";
export type ExpenseType = "fijo" | "variable" | "recurrente" | "extraordinario";

export interface ExpenseCategory {
	id: string;
	name: string;
	/** Id de la categoría padre — si no viene, es una categoría de primer nivel. */
	parentId?: string;
}

export interface Expense {
	id: string;
	/** "YYYY-MM-DD" */
	date: string;
	amount: number;
	categoryId: string;
	description: string;
	supplier?: string;
	paymentMethod: string;
	/** Referencia de texto (número de factura/recibo) — sin adjuntar archivo, ver docs/DECISIONS.md. */
	invoiceRef?: string;
	status: ExpenseStatus;
	type: ExpenseType;
	/** Obligatorio cuando `status` es "anulado". */
	voidReason?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy?: string;
}

export type NewExpenseInput = Omit<
	Expense,
	"id" | "voidReason" | "createdBy" | "createdAt" | "updatedAt" | "updatedBy"
>;
