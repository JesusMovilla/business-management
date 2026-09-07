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
import type { InvestmentGroup } from "@/types";
import {
	type ProfitPayoutFormValues,
	profitPayoutFormSchema,
} from "./profit-payout-form-schema";

interface ProfitPayoutFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groups: InvestmentGroup[];
	onSubmit: (values: ProfitPayoutFormValues) => void;
}

function defaultFormValues(): Partial<ProfitPayoutFormValues> {
	return { date: new Date().toISOString().slice(0, 10), groupId: "" };
}

/** Igual que `InvestmentFormDialog`: móntalo con una `key` que cambie en cada apertura. */
export function ProfitPayoutFormDialog({
	open,
	onOpenChange,
	groups,
	onSubmit,
}: ProfitPayoutFormDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<
		z.input<typeof profitPayoutFormSchema>,
		unknown,
		ProfitPayoutFormValues
	>({
		resolver: zodResolver(profitPayoutFormSchema),
		defaultValues: defaultFormValues(),
	});

	const handleFormSubmit = handleSubmit((values) => {
		onSubmit(values);
		onOpenChange(false);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Registrar pago de ganancias</DialogTitle>
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
							<Label htmlFor="payout-date">Fecha</Label>
							<Input id="payout-date" type="date" {...register("date")} />
							{errors.date && (
								<span className="text-destructive text-xs">
									{errors.date.message}
								</span>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="payout-amount">Valor</Label>
							<Controller
								control={control}
								name="amount"
								render={({ field }) => (
									<CurrencyInput
										id="payout-amount"
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
						<Label htmlFor="payout-note">Período / nota</Label>
						<Input
							id="payout-note"
							placeholder="Ej: Ganancias de junio 2026"
							{...register("note")}
						/>
						{errors.note && (
							<span className="text-destructive text-xs">
								{errors.note.message}
							</span>
						)}
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isSubmitting}>
							Registrar pago
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
