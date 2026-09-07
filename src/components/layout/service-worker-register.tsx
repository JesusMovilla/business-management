"use client";

import { useEffect } from "react";

/**
 * Registra `public/sw.js` al montar. Necesario para que Chrome/Android considere la app
 * instalable y dispare el evento `beforeinstallprompt` que usa `PwaInstallButton` — sin un
 * service worker con manejador de `fetch`, ese evento nunca se dispara.
 */
export function ServiceWorkerRegister() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => {});
		}
	}, []);

	return null;
}
