const STOCK_MOVEMENT_TYPES = [
	"entrada",
	"venta",
	"merma",
	"ajuste",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const MERMA_REASONS = [
	"vencimiento",
	"rotura",
	"derrame",
	"otro",
] as const;

export type MermaReason = (typeof MERMA_REASONS)[number];

export interface StockMovement {
	id: string;
	productId: string;
	type: StockMovementType;
	/** Positivo suma, negativo resta; el signo ya viene resuelto según el tipo. */
	delta: number;
	date: string;
	/** Solo cuando `type === "merma"`. */
	reason?: MermaReason;
	note?: string;
	userId: string;
}
