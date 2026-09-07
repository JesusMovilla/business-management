import {
	Boxes,
	Briefcase,
	Calendar,
	ClipboardList,
	Contact,
	Home,
	Landmark,
	LineChart,
	PiggyBank,
	Receipt,
	Settings,
	Users,
	Wallet,
} from "lucide-react";
import type { AppModule } from "@/types";

export interface NavItem {
	label: string;
	href: string;
	/** Sin `module`, el ítem es siempre visible (ej. Inicio) — no pasa por la matriz de permisos. */
	module?: AppModule;
	icon: typeof Boxes;
}

export interface NavGroup {
	label: string;
	icon: typeof Boxes;
	items: NavItem[];
}

/** Entrada del nav: ítem suelto o grupo colapsable. Usado por `NavList` (desktop y móvil). */
export type NavEntry =
	| { type: "item"; item: NavItem }
	| { type: "group"; group: NavGroup };

export const NAV_ENTRIES: NavEntry[] = [
	{
		type: "item",
		item: { label: "Inicio", href: "/inicio", icon: Home },
	},
	{
		type: "group",
		group: {
			label: "Operación",
			icon: Briefcase,
			items: [
				{
					label: "Inventario",
					href: "/inventario",
					module: "inventario",
					icon: Boxes,
				},
				{
					label: "Pedidos",
					href: "/pedidos",
					module: "pedidos",
					icon: ClipboardList,
				},
				{
					label: "Cierre de caja",
					href: "/cierre-caja",
					module: "cierre-caja",
					icon: Wallet,
				},
			],
		},
	},
	{
		type: "group",
		group: {
			label: "Finanzas",
			icon: Landmark,
			items: [
				{
					label: "Rentabilidad",
					href: "/rentabilidad",
					module: "rentabilidad",
					icon: LineChart,
				},
				{
					label: "Control de inversión",
					href: "/inversion",
					module: "inversion",
					icon: PiggyBank,
				},
				{
					label: "Control de gastos",
					href: "/gastos",
					module: "gastos",
					icon: Receipt,
				},
			],
		},
	},
	{
		type: "group",
		group: {
			label: "Administración",
			icon: Users,
			items: [
				{
					label: "Libreta de contactos",
					href: "/contactos",
					module: "contactos",
					icon: Contact,
				},
				{
					label: "Calendario",
					href: "/calendario",
					module: "calendario",
					icon: Calendar,
				},
			],
		},
	},
	{
		type: "item",
		item: {
			label: "Configuración",
			href: "/admin",
			module: "admin",
			icon: Settings,
		},
	},
];
