import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { DebtorMovement } from "@/types";
import { reconcileDebtorMovements } from "../lib/debtor-reconciliation";

function formatDate(date: string): string {
	const [year, month, day] = date.split("-");
	return `${day}/${month}/${year}`;
}

function MovementTypeBadge({ type }: { type: DebtorMovement["type"] }) {
	return type === "deuda" ? (
		<Badge className="bg-(--balance-shortage-bg) text-(--balance-shortage-fg)">
			Deuda
		</Badge>
	) : (
		<Badge className="bg-(--balance-ok-bg) text-(--balance-ok-fg)">Abono</Badge>
	);
}

/** Estado de una deuda puntual — derivado de `reconcileDebtorMovements` (FIFO contra los abonos
 * posteriores), no de un campo persistido. No aplica a los abonos. */
function DebtSettlementBadge({ remainingAmount }: { remainingAmount: number }) {
	return remainingAmount === 0 ? (
		<Badge className="bg-(--balance-ok-bg) text-(--balance-ok-fg)">
			Pagada
		</Badge>
	) : (
		<Badge className="bg-(--balance-shortage-bg) text-(--balance-shortage-fg)">
			Pendiente {formatCurrency(remainingAmount)}
		</Badge>
	);
}

interface DebtorMovementsListCardProps {
	movements: DebtorMovement[];
}

/**
 * Historial cronológico completo de un deudor (deudas y abonos) — ledger append-only, nunca se
 * edita ni se borra un movimiento. Cada uno enlaza al cierre de caja que lo originó, si aplica.
 * Cada deuda puntual muestra si ya quedó cubierta por abonos posteriores (`DebtSettlementBadge`,
 * cálculo FIFO de solo lectura) — así se ve, por ejemplo, que el faltante de un cierre concreto
 * ya se cobró, sin necesidad de tocar ese cierre histórico.
 */
export function DebtorMovementsListCard({
	movements,
}: DebtorMovementsListCardProps) {
	const reconciled = reconcileDebtorMovements(movements);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Historial de movimientos</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{reconciled.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Aún no hay movimientos registrados.
					</p>
				) : (
					<>
						<div className="flex flex-col gap-2 sm:hidden">
							{reconciled.map((movement) => (
								<div key={movement.id} className="rounded-md border p-3">
									<div className="flex items-center justify-between gap-2">
										<MovementTypeBadge type={movement.type} />
										<span className="text-sm font-medium">
											{formatCurrency(movement.amount)}
										</span>
									</div>
									<div className="text-muted-foreground mt-2 text-xs">
										{formatDate(movement.date)}
										{movement.note ? ` — ${movement.note}` : ""}
									</div>
									{movement.type === "deuda" && (
										<div className="mt-2">
											<DebtSettlementBadge
												remainingAmount={movement.remainingAmount}
											/>
										</div>
									)}
									{movement.cashClosingId && (
										<Link
											href={`/cierre-caja/${movement.cashClosingId}`}
											className="text-primary mt-1 inline-block text-xs underline"
										>
											Ver cierre de caja
										</Link>
									)}
								</div>
							))}
						</div>
						<div className="hidden sm:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Fecha</TableHead>
										<TableHead>Tipo</TableHead>
										<TableHead>Monto</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead>Nota</TableHead>
										<TableHead>Origen</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reconciled.map((movement) => (
										<TableRow key={movement.id}>
											<TableCell>{formatDate(movement.date)}</TableCell>
											<TableCell>
												<MovementTypeBadge type={movement.type} />
											</TableCell>
											<TableCell>{formatCurrency(movement.amount)}</TableCell>
											<TableCell>
												{movement.type === "deuda" ? (
													<DebtSettlementBadge
														remainingAmount={movement.remainingAmount}
													/>
												) : (
													"—"
												)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{movement.note || "—"}
											</TableCell>
											<TableCell>
												{movement.cashClosingId ? (
													<Link
														href={`/cierre-caja/${movement.cashClosingId}`}
														className="text-primary underline"
													>
														Ver cierre
													</Link>
												) : (
													"—"
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
