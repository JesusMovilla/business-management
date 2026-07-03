import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Next.js carga .env.local solo para su propio runtime; drizzle-kit corre fuera de eso.
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
	process.loadEnvFile(".env.local");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema/index.ts",
	out: "./src/db/migrations",
	dbCredentials: {
		url: process.env.DATABASE_URL as string,
	},
});
