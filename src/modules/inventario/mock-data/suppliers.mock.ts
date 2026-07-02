import type { Supplier } from "@/types";

export const SUPPLIER_BAVARIA = "sup-bavaria";
export const SUPPLIER_DIAGEO = "sup-diageo";
export const SUPPLIER_PERNOD = "sup-pernod";
export const SUPPLIER_LICORERA = "sup-licorera-local";

export const suppliersMock: Supplier[] = [
	{
		id: SUPPLIER_BAVARIA,
		name: "Bavaria S.A.",
		contactName: "Ricardo Salas",
		phone: "+57 300 555 1234",
		email: "ventas@bavaria.com.co",
		address: "Zona Industrial, Bogotá",
	},
	{
		id: SUPPLIER_DIAGEO,
		name: "Diageo Colombia",
		contactName: "Mónica Reyes",
		phone: "+57 310 555 8899",
		email: "pedidos@diageo.com",
		address: "Cra 7 # 90-10, Bogotá",
	},
	{
		id: SUPPLIER_PERNOD,
		name: "Pernod Ricard Colombia",
		contactName: "Felipe Duarte",
		phone: "+57 315 555 4477",
		email: "distribucion@pernod-ricard.com",
		address: "Autopista Norte, Bogotá",
	},
	{
		id: SUPPLIER_LICORERA,
		name: "Distribuidora Licorera del Valle",
		contactName: "Sandra Ibarra",
		phone: "+57 320 555 6633",
		email: "contacto@licoreravalle.com",
		address: "Cali, Valle del Cauca",
		notes: "Proveedor local para aguardientes y rones regionales.",
	},
];
