import { sileo } from "sileo";

/**
 * Punto único para disparar toasts en toda la app (sobre `sileo`). Importar esto en vez de
 * `sileo` directamente, para no acoplar cada módulo a la librería subyacente.
 */
export const toast = {
	success: (title: string) => sileo.success({ title }),
	error: (title: string) => sileo.error({ title }),
	warning: (title: string) => sileo.warning({ title }),
	info: (title: string) => sileo.info({ title }),
};
