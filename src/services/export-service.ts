import type { AnalyticsResult } from "./analytics-service.js";

/** Metric keys supported for export (allowlist for CSV headers — prevents injection). */
export const ALLOWED_EXPORT_METRICS = [
  "activeUsers",
  "events",
  "sessions",
  "pageViews",
  "apiCalls",
  "errorRate",
] as const;

export function getAllowedMetrics(): string[] {
  return [...ALLOWED_EXPORT_METRICS];
}

/** Escape a CSV cell (wrap in quotes if contains comma, quote, or newline). */
function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[,"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build CSV string from analytics result for the given metric keys.
 * Only allowlisted metrics are included; order follows metricKeys.
 */
export function buildCsv(result: AnalyticsResult, metricKeys: string[]): string {
  const allowedSet = new Set(ALLOWED_EXPORT_METRICS);
  const safeKeys = metricKeys.filter((k) => allowedSet.has(k as (typeof ALLOWED_EXPORT_METRICS)[number]));
  if (safeKeys.length === 0) {
    throw new Error("No allowlisted metrics");
  }
  const header = ["date", ...safeKeys].map(escapeCsvCell).join(",");
  const rows: string[] = [header];
  for (let i = 0; i < result.totalRows; i++) {
    const date = result.labels[i] ?? "";
    const cells = [date, ...safeKeys.map((k) => result.data[k]?.[i] ?? "")].map(escapeCsvCell);
    rows.push(cells.join(","));
  }
  return rows.join("\n");
}

const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Sanitize workspace id for use in filename: only [a-zA-Z0-9._-].
 */
function sanitizeWorkspaceId(workspaceId: string): string {
  return workspaceId.replace(/[^a-zA-Z0-9._-]/g, "");
}

/**
 * Validate ISO date string (YYYY-MM-DD) and return it, or throw.
 */
function parseIsoDate(s: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) throw new Error("Invalid date format; use YYYY-MM-DD");
  const [, y, m, d] = match;
  const yn = parseInt(y!, 10);
  const mn = parseInt(m!, 10);
  const dn = parseInt(d!, 10);
  if (mn < 1 || mn > 12 || dn < 1 || dn > 31) throw new Error("Invalid date");
  const date = new Date(yn, mn - 1, dn);
  if (date.getFullYear() !== yn || date.getMonth() !== mn - 1 || date.getDate() !== dn) {
    throw new Error("Invalid date");
  }
  return `${y}-${m}-${d}`;
}

/**
 * Build a safe export filename from workspace id and validated date range.
 * Only sanitized values; no user-supplied free text.
 */
export function sanitizeExportFilename(
  workspaceId: string,
  fromDate: string,
  toDate: string,
): string {
  const safe = sanitizeWorkspaceId(workspaceId) || "workspace";
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  const name = `export-${safe}-${from}-${to}.csv`;
  if (!SAFE_FILENAME_REGEX.test(name.replace(".csv", ""))) {
    throw new Error("Filename contained invalid characters");
  }
  return name;
}
