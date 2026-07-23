import { db } from "./client";
import { cashClosingItems, cashClosings } from "./schema/cash-closing";
import { contacts } from "./schema/contacts";
import { expenseCategories, expenses } from "./schema/expenses";
import { categories, products, stockMovements } from "./schema/inventory";
import { investments } from "./schema/investment";
import { profitPayouts } from "./schema/proyeccion";
import { purchaseOrderLines, purchaseOrders } from "./schema/purchase-orders";

/**
 * Borra todos los datos de negocio sembrados por mocks, conservando usuarios, roles,
 * grupos de inversores y sus miembros (investment_groups / investment_group_members).
 * Respeta el orden de FKs: hijos antes que padres. Todo en una sola transacción — si una
 * eliminación falla a mitad de camino (ej. una FK que no se contempló), no queda la base de datos
 * en un estado parcialmente limpiado.
 */
async function clean() {
	await db.transaction(async (tx) => {
		await tx.delete(purchaseOrderLines);
		await tx.delete(purchaseOrders);
		await tx.delete(cashClosingItems);
		await tx.delete(stockMovements);
		await tx.delete(cashClosings);
		await tx.delete(products);
		await tx.delete(categories);
		await tx.delete(expenses);
		await tx.delete(expenseCategories);
		await tx.delete(profitPayouts);
		await tx.delete(investments);
		await tx.delete(contacts);
	});

	console.log(
		"Base de datos limpiada: se conservaron usuarios, roles y grupos de inversores.",
	);
	process.exit(0);
}

clean().catch((error) => {
	console.error(error);
	process.exit(1);
});
