import { ContactTable } from "@/modules/contactos/components/contact-table";

export default function ContactosPage() {
	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Contactos</h1>
				<p className="text-muted-foreground text-sm">
					Personas y proveedores de servicios del negocio (mantenimiento,
					arrendador, trabajadores, etc.).
				</p>
			</div>
			<ContactTable />
		</div>
	);
}
