import {
	Boxes,
	Calendar,
	ClipboardList,
	Contact,
	LineChart,
	PiggyBank,
	Receipt,
	Settings,
	Wallet,
} from "lucide-react";
import type { AppModule } from "@/types";

export interface NavItem {
	label: string;
	href: string;
	module: AppModule;
	icon: typeof Boxes;
}

export const NAV_ITEMS: NavItem[] = [
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
		label: "Proyección de ganancias",
		href: "/proyeccion",
		module: "proyeccion",
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
	{
		label: "Cierre de caja",
		href: "/cierre-caja",
		module: "cierre-caja",
		icon: Wallet,
	},
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
	{ label: "Administración", href: "/admin", module: "admin", icon: Settings },
];
