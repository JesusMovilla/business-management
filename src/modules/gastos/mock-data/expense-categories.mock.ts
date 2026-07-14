import type { ExpenseCategory } from "@/types";

export const expenseCategoriesMock: ExpenseCategory[] = [
	{ id: "exp-cat-arriendo", name: "Arriendo" },
	{ id: "exp-cat-servicios", name: "Servicios públicos" },
	{ id: "exp-cat-nomina", name: "Nómina" },
	{ id: "exp-cat-transporte", name: "Transporte" },
	{ id: "exp-cat-publicidad", name: "Publicidad" },
	{ id: "exp-cat-mantenimiento", name: "Mantenimiento" },
	{ id: "exp-cat-impuestos", name: "Impuestos" },
	{ id: "exp-cat-honorarios", name: "Honorarios" },
	{ id: "exp-cat-software", name: "Software y suscripciones" },
	{ id: "exp-cat-bancarios", name: "Gastos bancarios" },
	{ id: "exp-cat-otros", name: "Otros gastos" },
	{
		id: "exp-cat-publicidad-redes",
		name: "Redes sociales",
		parentId: "exp-cat-publicidad",
	},
	{
		id: "exp-cat-publicidad-diseno",
		name: "Diseño",
		parentId: "exp-cat-publicidad",
	},
];
