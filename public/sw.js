// Service worker mínimo: no cachea nada, solo existe para que Chrome/Android considere la app
// instalable (requiere un service worker con manejador de "fetch" para disparar
// `beforeinstallprompt`). Ver PwaInstallButton y docs/ARCHITECTURE.md.
self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});
