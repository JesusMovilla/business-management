import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "./client";
import { cashClosingItems, products } from "./schema";

/**
 * Ítems de cierre de caja creados antes de que existiera `unit_cost` se quedan con la columna en
 * `null` — sin este backfill, la ganancia real de esas ventas cae al costo *vigente* del producto
 * como aproximación cada vez que se consulta (ver docs/DECISIONS.md). Correrlo una sola vez,
 * mientras hay pocos registros, fija esa aproximación como snapshot explícito en vez de dejarla
 * recalculándose contra un costo que sigue cambiando. Ítems cuyo producto ya se eliminó quedan sin
 * tocar (no hay costo vigente que copiar) — la query de proyección sigue cubriendo ese caso vía
 * `coalesce`.
 */
async function backfillUnitCost() {
	const result = await db
		.update(cashClosingItems)
		.set({ unitCost: sql`${products.cost}` })
		.from(products)
		.where(
			and(
				eq(cashClosingItems.productId, products.id),
				isNull(cashClosingItems.unitCost),
			),
		);

	console.log(
		`unit_cost actualizado en ${result.rowCount ?? 0} ítem(s) de cierre de caja.`,
	);
}

backfillUnitCost()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
