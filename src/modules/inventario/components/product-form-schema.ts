import { z } from "zod";

export const productFormSchema = z.object({
	sku: z.string().min(1, "El código/SKU es obligatorio"),
	name: z.string().min(1, "El nombre es obligatorio"),
	brand: z.string().min(1, "La marca es obligatoria"),
	categoryId: z.string().min(1, "Selecciona una categoría"),
	presentation: z.string().min(1, "La presentación es obligatoria"),
	volumeMl: z.coerce.number().min(0).optional(),
	quantity: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	minStock: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	warehouseLocation: z.string().min(1, "La ubicación es obligatoria"),
	cost: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	retailPrice: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	wholesalePrice: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	supplierId: z.string().min(1, "Selecciona un proveedor"),
	lastPurchaseDate: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
