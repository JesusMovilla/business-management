import { contactRepository } from "@/data/repositories/contact-repository";
import { ContactTable } from "@/modules/contactos/components/contact-table";

// Los contactos viven en Postgres real, no en un snapshot estático: renderizar por request.
export const dynamic = "force-dynamic";

export default async function ContactosPage() {
	const contacts = await contactRepository.list();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-semibold">Contactos</h1>
				<p className="text-muted-foreground text-sm">
					Personas y proveedores de servicios del negocio (mantenimiento,
					arrendador, trabajadores, etc.).
				</p>
			</div>
			<ContactTable initialContacts={contacts} />
		</div>
	);
}
