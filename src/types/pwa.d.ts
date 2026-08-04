export {};

declare global {
	interface Window {
		/** Capturado por el script inline de `src/app/layout.tsx` — ver `PwaInstallButton`. */
		__pwaInstallPrompt?: Event;
	}
}
