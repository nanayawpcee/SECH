/**
 * One CSV cell. Quoted so commas and line breaks stay in their column, and
 * prefixed with ' when it starts like a formula — these fields are typed by
 * the public, and "=HYPERLINK(...)" in a name would otherwise run when the
 * export is opened in Excel.
 */
export function csvCell(value: string) {
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${v.replace(/"/g, '""')}"`;
}

/** Build a CSV and hand it to the browser as a download. */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  // BOM so Excel opens it as UTF-8 and keeps names like "Adwoa Mensah-Bonsu" intact.
  const csv = "﻿" + [headers, ...rows].map((r) => r.map((c) => csvCell(String(c ?? ""))).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
