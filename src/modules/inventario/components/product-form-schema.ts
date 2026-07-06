import { z } from "zod";
import type { NewProductInput } from "@/types";

export const productFormSchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio"),
	brand: z.string().min(1, "La marca es obligatoria"),
	categoryId: z.string().min(1, "Selecciona una categoría"),
	presentation: z.string().min(1, "La presentación es obligatoria"),
	volumeMl: z.coerce.number().min(0).optional(),
	initialQuantity: z.coerce.number().min(0, "Debe ser 0 o mayor").optional(),
	minStock: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	cost: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	retailPrice: z.coerce.number().min(0, "Debe ser 0 o mayor"),
	lastPurchaseDate: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/** Mapea los valores del formulario al input de creación/actualización de producto. */
export function toNewProductInput(values: ProductFormValues): NewProductInput {
	return {
		name: values.name,
		brand: values.brand,
		categoryId: values.categoryId,
		presentation: values.presentation,
		volumeMl: values.volumeMl,
		stock: {
			minStock: values.minStock,
		},
		pricing: {
			cost: values.cost,
			retailPrice: values.retailPrice,
		},
		lastPurchaseDate: values.lastPurchaseDate,
		active: true,
	};
}

/** Valida la forma de `NewProductInput` en el límite de confianza real: la Server Action. */
export const newProductInputSchema = z.object({
	name: z.string().min(1),
	brand: z.string().min(1),
	categoryId: z.string().min(1),
	presentation: z.string().min(1),
	volumeMl: z.number().min(0).optional(),
	stock: z.object({
		minStock: z.number().min(0),
	}),
	pricing: z.object({
		cost: z.number().min(0),
		retailPrice: z.number().min(0),
	}),
	lastPurchaseDate: z.string().optional(),
	imageUrl: z.string().optional(),
	active: z.boolean(),
});
