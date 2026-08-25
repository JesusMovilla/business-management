import { desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { debtorMovements, debtors } from "@/db/schema";
import type {
	Debtor,
	DebtorMovement,
	DebtorMovementType,
	DebtorWithMovements,
	NewDebtorMovementInput,
} from "@/types";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function toDebtor(row: typeof debtors.$inferSelect): Debtor {
	return {
		id: row.id,
		name: row.name,
		balance: row.balance,
		createdAt: row.createdAt,
		createdBy: row.createdBy,
		updatedAt: row.updatedAt,
		updatedBy: row.updatedBy ?? undefined,
	};
}

function toDebtorMovement(
	row: typeof debtorMovements.$inferSelect,
): DebtorMovement {
	return {
		id: row.id,
		debtorId: row.debtorId,
		type: row.type as DebtorMovementType,
		amount: row.amount,
		date: row.date,
		note: row.note ?? undefined,
		cashClosingId: row.cashClosingId ?? undefined,
		createdAt: row.createdAt,
		createdBy: row.createdBy,
	};
}

/** `deuda` suma al balance, `abono` resta — ver `docs/DECISIONS.md`. */
function balanceDelta(type: DebtorMovementType, amount: number): number {
	return type === "deuda" ? amount : -amount;
}

export type DebtorSummary = Debtor & { lastActivityDate?: string };

export const debtorRepository = {
	/** Listado completo con la fecha del movimiento más reciente de cada deudor (para la columna
	 * "Última actividad") — deudores con balance pendiente primero, para el seguimiento de cobro. */
	async listAll(): Promise<DebtorSummary[]> {
		const rows = await db
			.select({
				debtor: debtors,
				lastActivityDate: sql<string | null>`max(${debtorMovements.date})`,
			})
			.from(debtors)
			.leftJoin(debtorMovements, eq(debtorMovements.debtorId, debtors.id))
			.groupBy(debtors.id)
			.orderBy(desc(debtors.balance), debtors.name);
		return rows.map(({ debtor, lastActivityDate }) => ({
			...toDebtor(debtor),
			lastActivityDate: lastActivityDate ?? undefined,
		}));
	},

	/** Búsqueda por nombre (case-insensitive) para el selector del diálogo de asignación — con
	 * `query` vacío se comporta como un listado (sin filtro), para que el selector muestre algo
	 * apenas se enfoca, no solo al escribir. */
	async search(query: string): Promise<Debtor[]> {
		const rows = await db
			.select()
			.from(debtors)
			.where(ilike(debtors.name, `%${query}%`))
			.orderBy(desc(debtors.balance), debtors.name)
			.limit(20);
		return rows.map(toDebtor);
	},

	async getById(id: string): Promise<DebtorWithMovements | null> {
		const [row] = await db.select().from(debtors).where(eq(debtors.id, id));
		if (!row) return null;
		const movementRows = await db
			.select()
			.from(debtorMovements)
			.where(eq(debtorMovements.debtorId, id))
			.orderBy(desc(debtorMovements.date), desc(debtorMovements.createdAt));
		return { ...toDebtor(row), movements: movementRows.map(toDebtorMovement) };
	},

	/** Crea un deudor nuevo con balance en 0 — el movimiento inicial se registra por separado
	 * (`recordMovement`), normalmente en la misma transacción. */
	async createDebtor(
		name: string,
		userId: string,
		tx: Tx | typeof db = db,
	): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await tx.insert(debtors).values({
			id,
			name,
			balance: 0,
			createdAt: now,
			createdBy: userId,
			updatedAt: now,
			updatedBy: userId,
		});
		return id;
	},

	/**
	 * Inserta un movimiento y ajusta `balance` en la misma operación — acepta un `tx` para
	 * componerse con otras escrituras (ej. `cashClosingRepository.finalize`) en una sola
	 * transacción atómica.
	 */
	async recordMovement(
		debtorId: string,
		input: NewDebtorMovementInput,
		userId: string,
		tx: Tx | typeof db = db,
	): Promise<string> {
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		await tx.insert(debtorMovements).values({
			id,
			debtorId,
			type: input.type,
			amount: input.amount,
			date: input.date,
			note: input.note ?? null,
			cashClosingId: input.cashClosingId ?? null,
			createdAt: now,
			createdBy: userId,
		});
		await tx
			.update(debtors)
			.set({
				balance: sql`${debtors.balance} + ${balanceDelta(input.type, input.amount)}`,
				updatedAt: now,
				updatedBy: userId,
			})
			.where(eq(debtors.id, debtorId));
		return id;
	},

	/** Crea el deudor y registra su primer movimiento en un solo paso — mismo `tx` para ambos. */
	async createDebtorAndRecordMovement(
		name: string,
		input: NewDebtorMovementInput,
		userId: string,
		tx: Tx | typeof db = db,
	): Promise<string> {
		const debtorId = await debtorRepository.createDebtor(name, userId, tx);
		await debtorRepository.recordMovement(debtorId, input, userId, tx);
		return debtorId;
	},
};
