"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PageHeaderProps {
	title: ReactNode;
	description?: ReactNode;
	/** Insignia/badge junto al título (ej. estado "Revertido"). */
	badge?: ReactNode;
	/** Ruta a la que volver — renderiza la flecha como link. Ignorado si se pasa `onBack`. */
	backHref?: string;
	/** Vuelve sin navegar (ej. alternar de una vista de edición a la de solo lectura). */
	onBack?: () => void;
	/** Texto junto a la flecha de volver; por defecto "Volver". */
	backLabel?: string;
	/** Botones/acciones a la derecha del título. */
	actions?: ReactNode;
}

/**
 * Cabecera estándar de página: título + descripción opcional, acciones a la derecha y, si se
 * pasa `backHref` u `onBack`, una flecha para volver a la página/vista anterior. No pasar
 * ninguna de las dos en la raíz de un módulo (ej. Inventario, Pedidos), donde no hay a dónde
 * volver.
 *
 * @example
 * <PageHeader title="Nuevo producto" backHref="/inventario" />
 * <PageHeader
 *   title="Editar cierre"
 *   onBack={() => setIsEditing(false)}
 *   backLabel="Volver al detalle"
 * />
 */
export function PageHeader({
	title,
	description,
	badge,
	backHref,
	onBack,
	backLabel = "Volver",
	actions,
}: PageHeaderProps) {
	const showBack = Boolean(backHref || onBack);
	const backClassName =
		"mb-1.5 flex w-fit items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground";

	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div>
				{showBack &&
					(onBack ? (
						<button type="button" onClick={onBack} className={backClassName}>
							<ArrowLeft className="size-3.5" />
							{backLabel}
						</button>
					) : (
						<Link href={backHref as string} className={backClassName}>
							<ArrowLeft className="size-3.5" />
							{backLabel}
						</Link>
					))}
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-2xl font-semibold">{title}</h1>
					{badge}
				</div>
				{description && (
					<p className="text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</div>
	);
}
