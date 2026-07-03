/**
 * Nombres para mostrar en el historial de movimientos (`StockMovement.userId`). Antes venían del
 * mock de usuarios de RBAC, pero ese módulo ya usa usuarios reales en Postgres — Movimientos sigue
 * siendo 100% mock por ahora, así que mantiene su propio dato de ejemplo, desacoplado de RBAC.
 */
export const movementAuthorsMock = [
	{ id: "user-admin", fullName: "Juan Movilla" },
];
