import type { Category } from "@/types";

export const CATEGORY_CERVEZA = "cat-cerveza";
export const CATEGORY_WHISKY = "cat-whisky";
export const CATEGORY_RON = "cat-ron";
export const CATEGORY_VODKA = "cat-vodka";
export const CATEGORY_VINO = "cat-vino";
export const CATEGORY_AGUARDIENTE = "cat-aguardiente";
export const CATEGORY_TEQUILA = "cat-tequila";

export const categoriesMock: Category[] = [
	{
		id: CATEGORY_CERVEZA,
		name: "Cerveza",
		description: "Cervezas nacionales e importadas",
	},
	{
		id: CATEGORY_WHISKY,
		name: "Whisky",
		description: "Whiskies escoceses, americanos y nacionales",
	},
	{ id: CATEGORY_RON, name: "Ron", description: "Rones nacionales y añejos" },
	{
		id: CATEGORY_VODKA,
		name: "Vodka",
		description: "Vodkas nacionales e importados",
	},
	{
		id: CATEGORY_VINO,
		name: "Vino",
		description: "Vinos tintos, blancos y espumosos",
	},
	{
		id: CATEGORY_AGUARDIENTE,
		name: "Aguardiente",
		description: "Aguardientes regionales",
	},
	{
		id: CATEGORY_TEQUILA,
		name: "Tequila",
		description: "Tequilas blancos y reposados",
	},
];
