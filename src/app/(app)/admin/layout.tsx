import { RouteGuard } from "@/components/guards/route-guard";

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<RouteGuard module="admin" action="ver">
			{children}
		</RouteGuard>
	);
}
