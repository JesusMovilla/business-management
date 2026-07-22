import { z } from "zod";

export const purchaseOrderFormSchema = z.object({
	supplier: z.string().min(1, "El proveedor es obligatorio"),
	orderDate: z.string().min(1, "La fecha es obligatoria"),
	note: z.string().optional(),
	lines: z
		.array(
			z.object({
				productId: z.string().min(1, "Selecciona un producto"),
				purchaseMode: z.enum(["paquete", "unidad"]),
				quantity: z.coerce.number().positive("Debe ser mayor a 0"),
				unitsPerPackage: z.coerce.number().positive("Debe ser mayor a 0"),
				unitCost: z.coerce.number().positive("Debe ser mayor a 0"),
			}),
		)
		.min(1, "Agrega al menos un producto"),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const receivePurchaseOrderSchema = z.object({
	receivedDate: z.string().min(1, "La fecha es obligatoria"),
	paymentMethod: z.string().min(1, "El método de pago es obligatorio"),
});

export type ReceivePurchaseOrderValues = z.infer<
	typeof receivePurchaseOrderSchema
>;
