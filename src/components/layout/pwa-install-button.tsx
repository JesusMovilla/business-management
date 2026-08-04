"use client";

import { Download, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		// @ts-expect-error -- solo existe en Safari/iOS
		window.navigator.standalone === true
	);
}

/**
 * Fila "Instalar app" para agregar la app a la pantalla de inicio. Se renderiza como una fila de
 * ancho completo (mismo patrón que el resto de acciones de `SidebarFooter`), no como un ícono
 * suelto, para no confundirla con una opción del selector de tema. Se muestra solo cuando aplica:
 * en Android/Chrome dispara el prompt nativo de instalación (`beforeinstallprompt`); en iOS/Safari
 * (que no soporta ese evento) abre un diálogo con los pasos manuales de "Compartir → Agregar a
 * inicio". No se renderiza si la app ya está instalada o si el navegador no soporta ninguna vía.
 */
export function PwaInstallButton() {
	const [installEvent, setInstallEvent] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isIOS, setIsIOS] = useState(false);
	const [installed, setInstalled] = useState(false);
	const [iosDialogOpen, setIosDialogOpen] = useState(false);

	useEffect(() => {
		setInstalled(isStandalone());
		setIsIOS(
			/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window),
		);

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setInstallEvent(event as BeforeInstallPromptEvent);
		};
		const handleAppInstalled = () => {
			setInstallEvent(null);
			setInstalled(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);
		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	if (installed) return null;

	const handleClick = async () => {
		if (installEvent) {
			await installEvent.prompt();
			const { outcome } = await installEvent.userChoice;
			if (outcome === "accepted") setInstallEvent(null);
			return;
		}
		if (isIOS) setIosDialogOpen(true);
	};

	if (!installEvent && !isIOS) return null;

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				className="flex w-full items-center gap-2.5 border-b px-4 py-2.5 text-left text-sm font-medium hover:bg-accent"
			>
				<Download className="size-4" />
				Instalar app
			</button>
			<Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Instalar la app en tu iPhone o iPad</DialogTitle>
					</DialogHeader>
					<ol className="flex flex-col gap-3 text-sm">
						<li className="flex items-center gap-3">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">
								1
							</span>
							<span className="flex items-center gap-1.5">
								Toca el botón <Share className="size-4" /> Compartir en Safari.
							</span>
						</li>
						<li className="flex items-center gap-3">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">
								2
							</span>
							<span className="flex items-center gap-1.5">
								Selecciona <SquarePlus className="size-4" /> "Agregar a inicio".
							</span>
						</li>
						<li className="flex items-center gap-3">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-medium">
								3
							</span>
							<span>Confirma tocando "Agregar".</span>
						</li>
					</ol>
				</DialogContent>
			</Dialog>
		</>
	);
}
