export function ComingSoon({ moduleName }: { moduleName: string }) {
	return (
		<div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-center">
			<h2 className="text-xl font-semibold">{moduleName}</h2>
			<p className="text-muted-foreground">
				Este módulo estará disponible próximamente.
			</p>
		</div>
	);
}
