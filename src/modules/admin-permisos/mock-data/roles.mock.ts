import type { Role } from "@/types";
import {
	buildAdminPermissions,
	buildBodegaPermissions,
	buildCajeroPermissions,
	buildVendedorPermissions,
} from "../lib/permission-matrix";

const SEED_DATE = "2026-01-01T00:00:00.000Z";

export const ROLE_ADMIN_ID = "role-admin";
export const ROLE_VENDEDOR_ID = "role-vendedor";
export const ROLE_CAJERO_ID = "role-cajero";
export const ROLE_BODEGA_ID = "role-bodega";

export const rolesMock: Role[] = [
	{
		id: ROLE_ADMIN_ID,
		name: "Administrador",
		description: "Acceso total a todos los módulos del sistema.",
		isSystem: true,
		permissions: buildAdminPermissions(),
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
	{
		id: ROLE_VENDEDOR_ID,
		name: "Vendedor",
		description: "Consulta inventario y gestiona pedidos.",
		isSystem: true,
		permissions: buildVendedorPermissions(),
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
	{
		id: ROLE_CAJERO_ID,
		name: "Cajero",
		description: "Gestiona el cierre de caja y consulta inventario.",
		isSystem: true,
		permissions: buildCajeroPermissions(),
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
	{
		id: ROLE_BODEGA_ID,
		name: "Bodega/Inventario",
		description: "Gestiona entradas y salidas de inventario.",
		isSystem: true,
		permissions: buildBodegaPermissions(),
		createdAt: SEED_DATE,
		updatedAt: SEED_DATE,
	},
];
