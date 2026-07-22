import { cashClosingItems, cashClosings } from "./schema/cash-closing";
import { contacts } from "./schema/contacts";
import { expenseCategories, expenses } from "./schema/expenses";
import { categories, products, stockMovements } from "./schema/inventory";
import { investments } from "./schema/investment";
import { profitPayouts } from "./schema/proyeccion";
import { db } from "./client";

/**
 * Borra todos los datos de negocio sembrados por mocks, conservando usuarios, roles,
 * grupos de inversores y sus miembros (investment_groups / investment_group_members).
 * Respeta el orden de FKs: hijos antes que padres.
 */
async function clean() {
	await db.delete(cashClosingItems);
	await db.delete(stockMovements);
	await db.delete(cashClosings);
	await db.delete(products);
	await db.delete(categories);
	await db.delete(expenses);
	await db.delete(expenseCategories);
	await db.delete(profitPayouts);
	await db.delete(investments);
	await db.delete(contacts);

	console.log("Base de datos limpiada: se conservaron usuarios, roles y grupos de inversores.");
	process.exit(0);
}

clean().catch((error) => {
	console.error(error);
	process.exit(1);
});
