"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import {
	useCategories,
	useProductMutations,
	useSkuExists,
	useSuppliers,
} from "../hooks/use-products";
import { CategoryFormDialog } from "./category-form";
import {
	type ProductFormValues,
	productFormSchema,
	toNewProductInput,
} from "./product-form-schema";
import { SupplierFormDialog } from "./supplier-form";

const DEFAULT_VALUES: Partial<ProductFormValues> = {
	categoryId: "",
	supplierId: "",
	minStock: 0,
	cost: 0,
	retailPrice: 0,
	wholesalePrice: 0,
};

/**
 * Diálogo compacto para dar de alta un producto nuevo sin salir del flujo actual — pensado para
 * cuando llega un pedido con un producto que todavía no existe en el catálogo. Crea el producto
 * con cantidad 0 (sin movimiento de entrada propio): quien lo invoca es responsable de registrar
 * la entrada correspondiente, por ejemplo desde `BulkEntradaDialog`. Ver `docs/MODULES.md`.
 */
export function QuickProductDialog({
	onCreated,
}: {
	onCreated: (productId: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const categories = useCategories();
	const suppliers = useSuppliers();
	const { addProduct } = useProductMutations();
	const skuExists = useSkuExists();

	const {
		register,
		handleSubmit,
		control,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof productFormSchema>, unknown, ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: DEFAULT_VALUES,
	});

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) reset(DEFAULT_VALUES);
		setOpen(nextOpen);
	};

	const onSubmit = async (values: ProductFormValues) => {
		if (skuExists(values.sku)) {
			setError("sku", { message: "Ya existe un producto con este SKU." });
			return;
		}
		try {
			const id = await toast.promise(addProduct(toNewProductInput(values), 0), {
				loading: "Creando producto...",
				success: "Producto creado correctamente.",
				error: (err) =>
					err instanceof Error ? err.message : "No se pudo crear el producto.",
			});
			onCreated(id);
			handleOpenChange(false);
		} catch {
			// El toast ya mostró el error.
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={<Button type="button" variant="outline" size="sm" />}
			>
				+ Producto nuevo
			</DialogTrigger>
			<DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Crear producto nuevo</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<FieldError label="Nombre" error={errors.name?.message}>
							<Input {...register("name")} />
						</FieldError>
						<FieldError label="Marca" error={errors.brand?.message}>
							<Input {...register("brand")} />
						</FieldError>
						<FieldError label="Código / SKU" error={errors.sku?.message}>
							<Input {...register("sku")} />
						</FieldError>
						<FieldError
							label="Presentación"
							error={errors.presentation?.message}
						>
							<Input
								placeholder="Ej. Botella 750ml"
								{...register("presentation")}
							/>
						</FieldError>
						<div className="flex flex-col gap-2">
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
						<FieldError
							label="Stock mínimo / alerta"
							error={errors.minStock?.message}
						>
							<Input type="number" {...register("minStock")} />
						</FieldError>
						<FieldError
							label="Ubicación en bodega"
							error={errors.warehouseLocation?.message}
						>
							<Input
								placeholder="Ej. Estante A1"
								{...register("warehouseLocation")}
							/>
						</FieldError>
						<FieldError label="Costo" error={errors.cost?.message}>
							<Input type="number" {...register("cost")} />
						</FieldError>
						<FieldError
							label="Precio venta al público"
							error={errors.retailPrice?.message}
						>
							<Input type="number" {...register("retailPrice")} />
						</FieldError>
						<FieldError
							label="Precio mayorista"
							error={errors.wholesalePrice?.message}
						>
							<Input type="number" {...register("wholesalePrice")} />
						</FieldError>
						<div className="flex flex-col gap-2">
							<Label>Proveedor</Label>
							<Controller
								control={control}
								name="supplierId"
								render={({ field }) => (
									<div className="flex items-center gap-2">
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Selecciona un proveedor" />
											</SelectTrigger>
											<SelectContent>
												{suppliers.map((supplier) => (
													<SelectItem key={supplier.id} value={supplier.id}>
														{supplier.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<SupplierFormDialog onCreated={field.onChange} />
									</div>
								)}
							/>
							{errors.supplierId && (
								<span className="text-destructive text-xs">
									{errors.supplierId.message}
								</span>
							)}
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isSubmitting}>
							Crear producto
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function FieldError({
	label,
	error,
	children,
}: {
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-2">
			<Label>{label}</Label>
			{children}
			{error && <span className="text-destructive text-xs">{error}</span>}
		</div>
	);
}
