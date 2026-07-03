import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { roleRepository } from "@/data/repositories/role-repository";
import { getCurrentSession } from "@/lib/auth/session";
import { RbacHydrator } from "@/providers/rbac-hydrator";

export const dynamic = "force-dynamic";

export default async function AppShellLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getCurrentSession();
	if (!session?.user) {
		redirect("/login");
	}
	const roles = await roleRepository.list();

	return (
		<RbacHydrator user={session.user} roles={roles}>
			<div className="flex h-screen w-full overflow-hidden">
				<AppSidebar />
				<div className="flex flex-1 flex-col overflow-hidden">
					<AppTopbar />
					<main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
				</div>
			</div>
		</RbacHydrator>
	);
}
