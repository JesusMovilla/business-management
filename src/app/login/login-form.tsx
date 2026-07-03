"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { type LoginFormValues, loginFormSchema } from "./login-form-schema";

export function LoginForm() {
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

	const onSubmit = async (values: LoginFormValues) => {
		setServerError(null);
		const { error } = await authClient.signIn.email(values);
		if (error) {
			setServerError(error.message ?? "Email o contraseña incorrectos.");
			return;
		}
		router.push("/");
		router.refresh();
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex w-full max-w-sm flex-col gap-4"
		>
			<div className="flex flex-col gap-2">
				<Label htmlFor="login-email">Email</Label>
				<Input
					id="login-email"
					type="email"
					autoComplete="email"
					{...register("email")}
				/>
				{errors.email && (
					<span className="text-destructive text-xs">
						{errors.email.message}
					</span>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<Label htmlFor="login-password">Contraseña</Label>
				<Input
					id="login-password"
					type="password"
					autoComplete="current-password"
					{...register("password")}
				/>
				{errors.password && (
					<span className="text-destructive text-xs">
						{errors.password.message}
					</span>
				)}
			</div>
			{serverError && (
				<span className="text-destructive text-sm">{serverError}</span>
			)}
			<Button type="submit" disabled={isSubmitting}>
				Entrar
			</Button>
		</form>
	);
}
