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
import type { Investment, InvestmentGroup } from "@/types";
import {
	type InvestmentFormValues,
	investmentFormSchema,
} from "./investment-form-schema";

interface InvestmentFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Si se pasa, el diálogo edita esa inversión; si no, crea una nueva. */
	investment?: Investment | null;
	groups: InvestmentGroup[];
	onSubmit: (values: InvestmentFormValues) => void;
}

function toFormValues(
	investment?: Investment | null,
): Partial<InvestmentFormValues> {
	if (!investment) {
		return { date: new Date().toISOString().slice(0, 10), groupId: "" };
	}
	return {
		date: investment.date,
		amount: investment.amount,
		groupId: investment.groupId,
		description: investment.description,
	};
}

/** Igual que `ExpenseFormDialog`: móntalo con una `key` que cambie en cada apertura. */
export function InvestmentFormDialog({
	open,
	onOpenChange,
	investment,
	groups,
	onSubmit,
}: InvestmentFormDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<
		z.input<typeof investmentFormSchema>,
		unknown,
		InvestmentFormValues
	>({
		resolver: zodResolver(investmentFormSchema),
		defaultValues: toFormValues(investment),
	});

	const handleFormSubmit = handleSubmit((values) => {
		onSubmit(values);
		onOpenChange(false);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{investment ? "Editar inversión" : "Nueva inversión"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label>Grupo</Label>
						<Controller
							control={control}
							name="groupId"
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Selecciona un grupo" />
									</SelectTrigger>
									<SelectContent>
										{groups.map((group) => (
											<SelectItem key={group.id} value={group.id}>
												{group.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						{errors.groupId && (
							<span className="text-destructive text-xs">
								{errors.groupId.message}
							</span>
						)}
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="investment-date">Fecha</Label>
							<Input id="investment-date" type="date" {...register("date")} />
							{errors.date && (
								<span className="text-destructive text-xs">
									{errors.date.message}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="investment-amount">Valor</Label>
							<Controller
								control={control}
								name="amount"
								render={({ field }) => (
									<CurrencyInput
										id="investment-amount"
										value={(field.value as number | undefined) ?? null}
										onValueChange={(value) =>
											field.onChange(value ?? undefined)
										}
									/>
								)}
							/>
							{errors.amount && (
								<span className="text-destructive text-xs">
									{errors.amount.message}
								</span>
							)}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="investment-description">Descripción</Label>
						<Input id="investment-description" {...register("description")} />
						{errors.description && (
							<span className="text-destructive text-xs">
								{errors.description.message}
							</span>
						)}
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isSubmitting}>
							{investment ? "Guardar" : "Registrar inversión"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
