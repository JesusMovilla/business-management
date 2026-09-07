import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Gestión de negocio",
		short_name: "Gestión",
		description:
			"Gestión de inventario, precios, pedidos y finanzas para tu negocio.",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#b45309",
		icons: [
			{
				src: "/icons/icon-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/icon-512.png",
				sizes: "512x512",
				type: "image/png",
			},
			{
				src: "/icons/icon-512-maskable.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
