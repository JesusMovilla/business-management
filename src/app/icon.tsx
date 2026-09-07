import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#b45309",
				borderRadius: 6,
			}}
		>
			<svg
				width="19"
				height="19"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#1c0f02"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				<path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z" />
				<path d="M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4" />
			</svg>
		</div>,
		size,
	);
}
