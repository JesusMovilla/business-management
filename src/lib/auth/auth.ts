import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "pg", schema }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	user: {
		additionalFields: {
			roleId: { type: "string", required: true },
			active: { type: "boolean", required: true, defaultValue: true },
		},
	},
	databaseHooks: {
		session: {
			create: {
				// Un usuario desactivado (`user.active = false`) no puede iniciar sesión, aunque
				// la contraseña sea correcta — ver docs/RBAC.md.
				before: async (session) => {
					const [row] = await db
						.select({ active: schema.user.active })
						.from(schema.user)
						.where(eq(schema.user.id, session.userId));
					if (row && !row.active) {
						return false;
					}
					return { data: session };
				},
			},
		},
	},
});
