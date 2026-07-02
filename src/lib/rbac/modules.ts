import { APP_MODULES, type AppModule } from "@/types";

export type { AppModule };
export { APP_MODULES };

export const MODULE_LABELS: Record<AppModule, string> = {
	inventario: "Inventario",
	pedidos: "Pedidos",
	proyeccion: "Proyección de ganancias",
	inversion: "Control de inversión",
	gastos: "Control de gastos",
	"cierre-caja": "Cierre de caja",
	contactos: "Libreta de contactos",
	calendario: "Calendario",
	admin: "Administración",
};
