import type { User } from "@/types";
import {
	ROLE_ADMIN_ID,
	ROLE_BODEGA_ID,
	ROLE_CAJERO_ID,
	ROLE_VENDEDOR_ID,
} from "./roles.mock";

export const usersMock: User[] = [
	{
		id: "user-admin",
		fullName: "Juan Movilla",
		email: "jmovilla@comercializadora-s3.com",
		roleId: ROLE_ADMIN_ID,
		active: true,
	},
	{
		id: "user-vendedor",
		fullName: "Laura Gómez",
		email: "laura.gomez@comercializadora-s3.com",
		roleId: ROLE_VENDEDOR_ID,
		active: true,
	},
	{
		id: "user-cajero",
		fullName: "Carlos Pérez",
		email: "carlos.perez@comercializadora-s3.com",
		roleId: ROLE_CAJERO_ID,
		active: true,
	},
	{
		id: "user-bodega",
		fullName: "Ana Torres",
		email: "ana.torres@comercializadora-s3.com",
		roleId: ROLE_BODEGA_ID,
		active: true,
	},
];
