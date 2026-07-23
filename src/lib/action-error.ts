import "server-only";

/** Código de error de Postgres, si el error viene de Drizzle/pg (nunca de un `throw new Error(...)` propio). */
function pgErrorCode(error: unknown): string | undefined {
	if (!(error instanceof Error)) return undefined;
	const cause = (error as { cause?: unknown }).cause;
	if (cause && typeof cause === "object" && "code" in cause) {
		const code = (cause as { code?: unknown }).code;
		return typeof code === "string" ? code : undefined;
	}
	return undefined;
}

/**
 * Convierte el error de una Server Action en un mensaje seguro para mostrar al usuario — nunca deja
 * pasar el texto crudo de una query fallida (`Failed query: ...`) ni depende de que Next.js redacte
 * el error en producción (ahí solo llega un "digest" inútil). Si el error es uno que el propio
 * repositorio lanzó a propósito (`throw new Error("mensaje en español")`, sin `cause` de Postgres),
 * ese mensaje ya es seguro y se usa tal cual. Si el error viene de Postgres/Drizzle (tiene
 * `cause.code`), se traduce: `fk` para violación de llave foránea (`23503`, el caso típico al
 * borrar/insertar un registro que depende de otro que no existe), `unique` para violación de
 * restricción única (`23505`, el caso típico al crear/renombrar algo con un nombre duplicado), o
 * `fallback` para cualquier otro código.
 */
export function toActionErrorMessage(
	error: unknown,
	options: { fallback: string; fk?: string; unique?: string },
): string {
	const code = pgErrorCode(error);
	if (code) {
		if (code === "23503" && options.fk) return options.fk;
		if (code === "23505" && options.unique) return options.unique;
		return options.fallback;
	}
	if (error instanceof Error && error.message) return error.message;
	return options.fallback;
}
