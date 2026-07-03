import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Next.js ya carga .env.local para su propio runtime (dev/build) — este load es un no-op ahí.
// Hace falta para scripts sueltos como src/db/seed.ts (corridos con tsx, fuera de Next).
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
