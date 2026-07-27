/** Quotes a CSV field only when it actually needs it (contains a comma,
 * quote, or newline) — keeps plain values like "10-A" unquoted and readable. */
function csvField(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV string from column headers + row objects and triggers a
 * browser download — fully client-side, no backend export endpoint needed
 * since the data's already loaded in the page. */
export function downloadCsv<T>(filename: string, headers: string[], rows: T[], toRow: (row: T) => unknown[]) {
  const lines = [headers.map(csvField).join(","), ...rows.map((row) => toRow(row).map(csvField).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
