"use client";

import { useState } from "react";
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
import { authClient } from "@/lib/auth/client";
import { toast } from "@/lib/toast";

interface ChangePasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
	open,
	onOpenChange,
}: ChangePasswordDialogProps) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleOpenChange = (next: boolean) => {
		onOpenChange(next);
		if (!next) {
			setCurrentPassword("");
			setNewPassword("");
		}
	};

	const handleSubmit = async () => {
		if (!currentPassword || newPassword.length < 8) {
			toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
			return;
		}
		setIsSubmitting(true);
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (error) {
				toast.error(error.message ?? "No se pudo cambiar la contraseña.");
				return;
			}
			toast.success("Contraseña actualizada.");
			handleOpenChange(false);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Cambiar contraseña</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-2">
						<Label htmlFor="current-password">Contraseña actual</Label>
						<Input
							id="current-password"
							type="password"
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Label htmlFor="new-password">Contraseña nueva</Label>
						<Input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={(event) => setNewPassword(event.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
						Guardar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
