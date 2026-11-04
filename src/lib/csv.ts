// quote every cell, and prefix ' on anything that looks like a formula
export function csvCell(value: string) {
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${v.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  // BOM so Excel reads names as UTF-8
  const csv = "﻿" + [headers, ...rows].map((r) => r.map((c) => csvCell(String(c ?? ""))).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
