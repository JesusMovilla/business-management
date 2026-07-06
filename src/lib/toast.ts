import { sileo } from "sileo";

interface ToastPromiseOptions<T> {
	loading: string;
	success: string | ((data: T) => string);
	error: string | ((error: unknown) => string);
}

/**
 * Punto único para disparar toasts en toda la app (sobre `sileo`). Importar esto en vez de
 * `sileo` directamente, para no acoplar cada módulo a la librería subyacente.
 */
export const toast = {
	success: (title: string) => sileo.success({ title }),
	error: (title: string) => sileo.error({ title }),
	warning: (title: string) => sileo.warning({ title }),
	info: (title: string) => sileo.info({ title }),
	/**
	 * Muestra un toast "cargando" y lo transforma en éxito/error al resolverse `promise` — el
	 * indicador de "esto está corriendo" para mutaciones (crear/editar/eliminar), sin overlay
	 * bloqueante. `success`/`error` pueden ser un string fijo o derivarse del resultado/excepción.
	 */
	promise: <T>(
		promise: Promise<T> | (() => Promise<T>),
		opts: ToastPromiseOptions<T>,
	): Promise<T> =>
		sileo.promise(promise, {
			loading: { title: opts.loading },
			success: (data) => ({
				title:
					typeof opts.success === "function"
						? opts.success(data)
						: opts.success,
			}),
			error: (err) => ({
				title: typeof opts.error === "function" ? opts.error(err) : opts.error,
			}),
		}),
};
