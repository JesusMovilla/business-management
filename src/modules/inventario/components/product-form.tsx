"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { Product } from "@/types";
import { useCategories, useProductMutations } from "../hooks/use-products";
import { calcMarginPercent } from "../lib/calc-margin";
import { CategoryFormDialog } from "./category-form";
import {
	type ProductFormValues,
	productFormSchema,
	toNewProductInput,
} from "./product-form-schema";

interface ProductFormProps {
	mode: "create" | "edit";
	product?: Product;
}

function toFormValues(product?: Product): Partial<ProductFormValues> {
	if (!product)
		return {
			categoryId: "",
			initialQuantity: 0,
			minStock: 0,
			cost: 0,
			retailPrice: 0,
		};
	return {
		name: product.name,
		brand: product.brand,
		categoryId: product.categoryId,
		presentation: product.presentation,
		volumeMl: product.volumeMl,
		minStock: product.stock.minStock,
		cost: product.pricing.cost,
		retailPrice: product.pricing.retailPrice,
		lastPurchaseDate: product.lastPurchaseDate,
	};
}

export function ProductForm({ mode, product }: ProductFormProps) {
	const router = useRouter();
	const categories = useCategories();
	const { addProduct, updateProduct } = useProductMutations();

	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof productFormSchema>, unknown, ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: toFormValues(product),
	});

	const cost = Number(watch("cost")) || 0;
	const retailPrice = Number(watch("retailPrice")) || 0;

	const onSubmit = async (values: ProductFormValues) => {
		const input = toNewProductInput(values);
		try {
			if (mode === "create") {
				await toast.promise(addProduct(input, values.initialQuantity ?? 0), {
					loading: "Creando producto...",
					success: "Producto creado correctamente.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo crear el producto.",
				});
			} else if (product) {
				await toast.promise(updateProduct(product.id, input), {
					loading: "Guardando producto...",
					success: "Producto actualizado correctamente.",
					error: (err) =>
						err instanceof Error
							? err.message
							: "No se pudo actualizar el producto.",
				});
			}
			router.push("/inventario");
		} catch {
			// El toast ya mostró el error; el usuario se queda en el formulario para reintentar.
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Datos básicos</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FieldError label="Nombre" error={errors.name?.message}>
						<Input {...register("name")} />
					</FieldError>
					<FieldError label="Marca" error={errors.brand?.message}>
						<Input {...register("brand")} />
					</FieldError>
					<FieldError label="Presentación" error={errors.presentation?.message}>
						<Input
							placeholder="Ej. Botella 750ml"
							{...register("presentation")}
						/>
					</FieldError>
					<FieldError label="Volumen (ml)" error={errors.volumeMl?.message}>
						<Input type="number" {...register("volumeMl")} />
					</FieldError>
					<div className="flex flex-col gap-2 sm:col-span-2">
						<Label>Categoría</Label>
						<Controller
							control={control}
							name="categoryId"
							render={({ field }) => (
								<div className="flex items-center gap-2">
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecciona una categoría" />
										</SelectTrigger>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<CategoryFormDialog onCreated={field.onChange} />
								</div>
							)}
						/>
						{errors.categoryId && (
							<span className="text-destructive text-xs">
								{errors.categoryId.message}
							</span>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Stock</CardTitle>
				</CardHeader>
				<CardContent
					className={`grid grid-cols-1 gap-4 ${mode === "create" ? "sm:grid-cols-2" : ""}`}
				>
					{mode === "create" && (
						<FieldError
							label="Cantidad inicial"
							error={errors.initialQuantity?.message}
							hint="Se registra como el primer movimiento de entrada."
						>
							<Input type="number" {...register("initialQuantity")} />
						</FieldError>
					)}
					<FieldError
						label="Stock mínimo / alerta"
						error={errors.minStock?.message}
					>
						<Input type="number" {...register("minStock")} />
					</FieldError>
					{mode === "edit" && product && (
						<p className="text-muted-foreground text-sm sm:col-span-2">
							Para cambiar la cantidad disponible, ve a{" "}
							<Link
								href={`/inventario/${product.id}`}
								className="text-primary hover:underline"
							>
								Movimientos
							</Link>{" "}
							en el detalle del producto.
						</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Precios y compra</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<FieldError label="Costo" error={errors.cost?.message}>
						<Controller
							control={control}
							name="cost"
							render={({ field }) => (
								<CurrencyInput
									value={(field.value as number | undefined) ?? null}
									onValueChange={(value) => field.onChange(value ?? undefined)}
								/>
							)}
						/>
					</FieldError>
					<FieldError
						label="Precio venta al público"
						error={errors.retailPrice?.message}
						hint={`Margen: ${calcMarginPercent(cost, retailPrice).toFixed(1)}%`}
					>
						<Controller
							control={control}
							name="retailPrice"
							render={({ field }) => (
								<CurrencyInput
									value={(field.value as number | undefined) ?? null}
									onValueChange={(value) => field.onChange(value ?? undefined)}
								/>
							)}
						/>
					</FieldError>
					<FieldError
						label="Fecha de última compra"
						error={errors.lastPurchaseDate?.message}
					>
						<Input type="date" {...register("lastPurchaseDate")} />
					</FieldError>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					disabled={isSubmitting}
					onClick={() => router.push("/inventario")}
				>
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{mode === "create" ? "Crear producto" : "Guardar cambios"}
				</Button>
			</div>
		</form>
	);
}

function FieldError({
	label,
	error,
	hint,
	children,
}: {
	label: string;
	error?: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label>{label}</Label>
			{children}
			{error ? (
				<span className="text-destructive text-xs">{error}</span>
			) : hint ? (
				<span className="text-muted-foreground text-xs">{hint}</span>
			) : null}
		</div>
	);
}
