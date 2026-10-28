import { createTextMatcher, normalizeSearchText } from "./text.js";

export function normalizeRootSearch(value) {
  return normalizeSearchText(value).replace(/^@/, "");
}

export function matchesRootSearch(term, values) {
  return createTextMatcher(normalizeRootSearch(term))(values);
}

export function csvCell(value) {
  let text = String(value ?? "");
  // Nombres y códigos externos nunca deben ejecutarse como fórmulas en Excel.
  if (typeof value !== "number" && (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function csvDocument(headers, rows) {
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename, headers, rows) {
  const url = URL.createObjectURL(new Blob([csvDocument(headers, rows)], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isRootNavigationActive(pathname, path) {
  return path === "/dashboard/admin" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
}
