import { ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Administración</h1>
				<p className="text-muted-foreground text-sm">
					Gestiona roles, permisos y usuarios del sistema.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Link href="/admin/roles">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="size-4" />
								Roles y permisos
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground text-sm">
							Crea roles personalizados y define su matriz de permisos por
							módulo.
						</CardContent>
					</Card>
				</Link>
				<Link href="/admin/usuarios">
					<Card className="transition-colors hover:bg-muted/50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="size-4" />
								Usuarios
							</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground text-sm">
							Consulta los usuarios y asígnales un rol.
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	);
}
