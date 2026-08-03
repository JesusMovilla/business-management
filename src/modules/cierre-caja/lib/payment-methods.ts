/** Opciones fijas de método de pago para una venta — texto libre en la base de datos (columna
 * `payment_method`), pero una lista cerrada en la UI para evitar variantes de escritura distintas
 * para lo mismo (ej. "efectivo" vs "Efectivo"). */
export const PAYMENT_METHODS = [
	"Efectivo",
	"Transferencia",
	"Efectivo + transferencia",
	"Por pagar",
] as const;
