function escapeCsvCell(value: string): string {
	if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
	return value;
}

export function toCsv(rows: string[][]): string {
	return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

/** Descarga un CSV en el navegador. `﻿` (BOM) para que Excel detecte UTF-8 correctamente. */
export function downloadCsv(filename: string, content: string): void {
	const blob = new Blob([`﻿${content}`], {
		type: "text/csv;charset=utf-8;",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
