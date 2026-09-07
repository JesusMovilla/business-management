import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { AppProviders } from "@/providers/app-providers";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

// Captura `beforeinstallprompt` antes de la hidratación de React: Chrome dispara ese evento una
// sola vez por sesión y solo llega a los listeners ya registrados en ese momento, así que si se
// dispara antes de que `PwaInstallButton` monte su propio listener (useEffect, tras hidratar) se
// perdería para siempre. `preventDefault()` evita además que Chrome muestre su propia UI
// automática de instalación mientras guardamos el evento para el botón "Instalar app".
// `PwaInstallButton` lee `window.__pwaInstallPrompt` al montar.
const PWA_INSTALL_CAPTURE_SCRIPT = `
window.addEventListener("beforeinstallprompt", function (event) {
  event.preventDefault();
  window.__pwaInstallPrompt = event;
});
`;

const atlassianSans = localFont({
	src: "./fonts/AtlassianSans-latin.ttf",
	variable: "--font-atlassian-sans",
	weight: "400",
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Gestión de negocio",
	description:
		"Gestión de inventario, precios, pedidos y finanzas para tu negocio.",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Gestión",
	},
};

export const viewport: Viewport = {
	themeColor: "#b45309",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="es"
			className={`${atlassianSans.variable} ${geistMono.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<head>
				<Script
					id="pwa-install-capture"
					strategy="beforeInteractive"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: contenido estático fijo, sin input de usuario
					dangerouslySetInnerHTML={{ __html: PWA_INSTALL_CAPTURE_SCRIPT }}
				/>
			</head>
			<body className="min-h-full flex flex-col">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AppProviders>{children}</AppProviders>
				</ThemeProvider>
			</body>
		</html>
	);
}
