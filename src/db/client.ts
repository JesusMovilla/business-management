import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as auth from "./schema/auth";
import * as contacts from "./schema/contacts";
import * as inventory from "./schema/inventory";
import * as roles from "./schema/roles";

const schema = { ...auth, ...contacts, ...inventory, ...roles };

// Next.js ya carga .env.local para su propio runtime (dev/build) — este load es un no-op ahí.
// Hace falta para scripts sueltos como src/db/clean.ts (corridos con tsx, fuera de Next).
// En producción (Vercel) no existe .env.local: las env vars ya vienen inyectadas por la plataforma.
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
	process.loadEnvFile(".env.local");
}

declare global {
	var __pgPool: Pool | undefined;
}

const pool =
	global.__pgPool ??
	new Pool({
		connectionString: process.env.DATABASE_URL,
	});

if (process.env.NODE_ENV !== "production") {
	global.__pgPool = pool;
}

export const db = drizzle(pool, { schema });
