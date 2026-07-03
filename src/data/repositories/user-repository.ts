import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import type { User } from "@/types";

function toUser(row: typeof user.$inferSelect): User {
	return {
		id: row.id,
		fullName: row.name,
		email: row.email,
		roleId: row.roleId,
		avatarUrl: row.image ?? undefined,
		active: row.active,
	};
}

export const userRepository = {
	async list(): Promise<User[]> {
		const rows = await db.select().from(user);
		return rows.map(toUser);
	},
	/** Crea el usuario vía better-auth (hashea la contraseña) y le asigna rol directo. */
	async create(input: {
		fullName: string;
		email: string;
		password: string;
		roleId: string;
	}): Promise<string> {
		const result = await auth.api.signUpEmail({
			body: {
				name: input.fullName,
				email: input.email,
				password: input.password,
				roleId: input.roleId,
				active: true,
			},
		});
		return result.user.id;
	},
	async assignRole(userId: string, roleId: string): Promise<void> {
		await db.update(user).set({ roleId }).where(eq(user.id, userId));
	},
	async setActive(userId: string, active: boolean): Promise<void> {
		await db.update(user).set({ active }).where(eq(user.id, userId));
	},
};
