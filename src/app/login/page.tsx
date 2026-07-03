import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<div className="flex h-screen flex-col items-center justify-center gap-6 p-4">
			<div className="text-center">
				<h1 className="text-2xl font-semibold">Mogo</h1>
				<p className="text-muted-foreground text-sm">
					Iniciá sesión para continuar.
				</p>
			</div>
			<LoginForm />
		</div>
	);
}
