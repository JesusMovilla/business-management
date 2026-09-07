import { AppLogoMark } from "@/components/layout/app-logo-mark";
import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<div className="flex h-dvh flex-col items-center justify-center gap-6 p-4">
			<div className="flex flex-col items-center gap-3 text-center">
				<AppLogoMark className="size-14 rounded-xl" iconClassName="size-7" />
				<h1 className="text-2xl font-semibold">Gestión de negocio</h1>
				<p className="text-muted-foreground text-sm">
					Iniciá sesión para continuar.
				</p>
			</div>
			<LoginForm />
		</div>
	);
}
