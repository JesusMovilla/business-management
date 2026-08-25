import type { DebtorMovement } from "@/types";

export interface ReconciledDebtorMovement extends DebtorMovement {
	/** Solo tiene sentido en movimientos `"deuda"`: cuánto de esa deuda puntual sigue sin pagar,
	 * calculado en orden cronológico (FIFO) contra los abonos posteriores del mismo deudor —
	 * puramente derivado del ledger existente, no se persiste en ningún lado. `0` significa que
	 * ese faltante específico ya quedó cubierto por uno o más abonos; en movimientos `"abono"`
	 * siempre es `0` (no aplica). */
	remainingAmount: number;
}

/**
 * Reconstruye, para cada deuda de un deudor, cuánto de ese faltante puntual sigue pendiente: los
 * abonos se aplican en orden cronológico a la deuda más antigua primero (FIFO), igual que pagar
 * las cuentas más viejas primero. Permite mostrar, por ejemplo, que el faltante de un cierre de
 * caja puntual ya se cobró — sin mutar ese cierre ni el movimiento original (ambos siguen
 * append-only, ver `docs/DECISIONS.md`); es un cálculo de solo lectura sobre `debtor_movements`.
 */
export function reconcileDebtorMovements(
	movements: DebtorMovement[],
): ReconciledDebtorMovement[] {
	const chronological = [...movements].sort(
		(a, b) =>
			a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
	);

	const remainingById = new Map<string, number>();
	const openDebtIds: string[] = [];

	for (const movement of chronological) {
		if (movement.type === "deuda") {
			remainingById.set(movement.id, movement.amount);
			openDebtIds.push(movement.id);
			continue;
		}
		let toApply = movement.amount;
		while (toApply > 0 && openDebtIds.length > 0) {
			const oldestId = openDebtIds[0];
			const oldestRemaining = remainingById.get(oldestId) ?? 0;
			const applied = Math.min(oldestRemaining, toApply);
			remainingById.set(oldestId, oldestRemaining - applied);
			toApply -= applied;
			if (remainingById.get(oldestId) === 0) openDebtIds.shift();
		}
	}

	return movements.map((movement) => ({
		...movement,
		remainingAmount:
			movement.type === "deuda" ? (remainingById.get(movement.id) ?? 0) : 0,
	}));
}
