import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AccesoDenegadoPage() {
	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
			<h1 className="text-2xl font-semibold">Acceso denegado</h1>
			<p className="text-muted-foreground max-w-sm">
				Tu rol activo no tiene permiso para ver esta sección. Cambia de rol o
				contacta a un administrador.
			</p>
			<Button render={<Link href="/inventario" />}>Volver al inicio</Button>
		</div>
	);
}
