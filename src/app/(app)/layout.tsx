import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

export default function AppShellLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen w-full">
			<AppSidebar />
			<div className="flex flex-1 flex-col">
				<AppTopbar />
				<main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
			</div>
		</div>
	);
}
