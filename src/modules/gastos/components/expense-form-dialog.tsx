"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import type { Expense, ExpenseCategory } from "@/types";
import {
	EXPENSE_TYPE_LABELS,
	type ExpenseFormValues,
	expenseFormSchema,
	expenseTypeValues,
} from "./expense-form-schema";

interface ExpenseFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa, el diálogo edita ese gasto; si no, crea uno nuevo. */
	expense?: Expense | null;
	categories: ExpenseCategory[];
	onSubmit: (values: ExpenseFormValues) => void;
	isPending?: boolean;
}

function toFormValues(expense?: Expense | null): Partial<ExpenseFormValues> {
	if (!expense) {
		return {
			date: new Date().toISOString().slice(0, 10),
			categoryId: "",
			type: "variable",
			status: "pagado",
		};
	}
	return {
		date: expense.date,
		amount: expense.amount,
		categoryId: expense.categoryId,
		description: expense.description,
		supplier: expense.supplier,
		paymentMethod: expense.paymentMethod,
		invoiceRef: expense.invoiceRef,
		type: expense.type,
		status: expense.status === "anulado" ? "pagado" : expense.status,
	};
}

/**
 * Diálogo de creación/edición de gasto. Igual que `ContactFormDialog` en Contactos, el llamador
 * debe montarlo con una `key` que cambie en cada apertura para reinicializar el formulario desde
 * `expense`. No permite anular — eso vive en `ExpenseVoidDialog`.
 */
export function ExpenseFormDialog({
	open,
	onOpenChange,
	expense,
	categories,
	onSubmit,
	isPending,
}: ExpenseFormDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof expenseFormSchema>, unknown, ExpenseFormValues>({
		resolver: zodResolver(expenseFormSchema),
		defaultValues: toFormValues(expense),
	});

	const submitting = isPending || isSubmitting;

	const handleFormSubmit = handleSubmit((values) => {
		onSubmit(values);
		onOpenChange(false);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{expense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="Fecha" error={errors.date?.message}>
							<Input type="date" {...register("date")} />
						</Field>
						<Field label="Valor" error={errors.amount?.message}>
							<Controller
								control={control}
								name="amount"
								render={({ field }) => (
									<CurrencyInput
										value={(field.value as number | undefined) ?? null}
										onValueChange={(value) =>
											field.onChange(value ?? undefined)
										}
									/>
								)}
							/>
						</Field>
						<div className="flex flex-col gap-2">
							<Label>Categoría</Label>
							<Controller
								control={control}
								name="categoryId"
								render={({ field }) => (
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
								)}
							/>
							{errors.categoryId && (
								<span className="text-destructive text-xs">
									{errors.categoryId.message}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label>Tipo</Label>
							<Controller
								control={control}
								name="type"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{expenseTypeValues.map((type) => (
												<SelectItem key={type} value={type}>
													{EXPENSE_TYPE_LABELS[type]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<Field label="Método de pago" error={errors.paymentMethod?.message}>
							<Input
								placeholder="Ej: Efectivo, transferencia"
								{...register("paymentMethod")}
							/>
						</Field>
						<Field label="Proveedor" error={errors.supplier?.message}>
							<Input {...register("supplier")} />
						</Field>
						<Field
							label="N.º de factura"
							error={errors.invoiceRef?.message}
							hint="Referencia de texto, sin adjuntar archivo."
						>
							<Input {...register("invoiceRef")} />
						</Field>
						<div className="flex flex-col gap-2">
							<Label>Estado</Label>
							<Controller
								control={control}
								name="status"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="pagado">Pagado</SelectItem>
											<SelectItem value="pendiente">Pendiente</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div className="sm:col-span-2">
							<Field label="Descripción" error={errors.description?.message}>
								<Input {...register("description")} />
							</Field>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={submitting}
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={submitting}>
							{expense ? "Guardar" : "Registrar gasto"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function Field({
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
