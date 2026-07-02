import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { AppProviders } from "@/providers/app-providers";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

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
	title: "Mogo — Gestión de negocio",
	description:
		"Gestión de inventario, precios, pedidos y finanzas para tu negocio.",
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
