export type InvestmentGroupStatus = "activo" | "inactivo";

export interface InvestmentGroup {
	id: string;
	name: string;
	status: InvestmentGroupStatus;
	/** Ids de usuarios ya existentes en el sistema asociados a este grupo — sin porcentaje interno
	 * por integrante, la membresía es solo informativa (ver docs/DECISIONS.md). */
	memberUserIds: string[];
}

export type NewInvestmentGroupInput = Omit<InvestmentGroup, "id">;

export type InvestmentStatus = "activa" | "anulada";

export interface Investment {
	id: string;
	/** "YYYY-MM-DD" */
	date: string;
	amount: number;
	groupId: string;
	description: string;
	status: InvestmentStatus;
	/** Obligatorio cuando `status` es "anulada". */
	voidReason?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	updatedBy?: string;
}

export type NewInvestmentInput = Omit<
	Investment,
	"id" | "voidReason" | "createdBy" | "createdAt" | "updatedAt" | "updatedBy"
>;

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
