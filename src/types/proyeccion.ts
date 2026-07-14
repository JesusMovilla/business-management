export type ProfitPayoutStatus = "activo" | "anulado";

export interface ProfitPayout {
	id: string;
	/** "YYYY-MM-DD" */
	date: string;
	amount: number;
	groupId: string;
	/** Referencia libre al período que cubre el pago (ej. "Junio 2026"), sin modelar Periodos. */
	note: string;
	status: ProfitPayoutStatus;
	/** Obligatorio cuando `status` es "anulado". */
	voidReason?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy?: string;
}

export type NewProfitPayoutInput = Omit<
	ProfitPayout,
	"id" | "voidReason" | "createdBy" | "createdAt" | "updatedAt" | "updatedBy"
>;
