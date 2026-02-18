import type { AnalyticsResult } from "./analytics-service.js";

/** Metric keys allowed in export (must match AnalyticsService capability). Prevents CSV injection. */
export const ALLOWED_METRICS = [
  "activeUsers",
  "events",
  "sessions",
  "pageViews",
  "apiCalls",
  "errorRate",
] as const;

export type AllowedMetric = (typeof ALLOWED_METRICS)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_METRICS);

export function isAllowedMetric(name: string): boolean {
  return ALLOWED_SET.has(name);
}

/** Filter to only allowlisted metrics that exist in result. */
export function filterAllowedMetrics(
  requested: string[],
  resultDataKeys: string[],
): string[] {
  return requested.filter(
    (m) => isAllowedMetric(m) && resultDataKeys.includes(m),
  );
}

function escapeCsvField(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from an AnalyticsResult. Only includes columns for
 * requested metrics that are in the allowlist and present in result.data.
 */
export function buildCsvFromResult(
  result: AnalyticsResult,
  requestedMetrics: string[],
): string {
  const allowed = requestedMetrics.filter((m) =>
    isAllowedMetric(m) && m in result.data,
  );
  if (allowed.length === 0) {
    return "date\n";
  }
  const header = ["date", ...allowed].map(escapeCsvField).join(",");
  const rows = result.labels.map((label, i) => {
    const cells = [
      escapeCsvField(label),
      ...allowed.map((m) => escapeCsvField(result.data[m][i] ?? "")),
    ];
    return cells.join(",");
  });
  return [header, ...rows].join("\n");
}

/** Safe filename from validated date range only. Characters in [a-zA-Z0-9._-]. */
export function buildExportFilename(startDate: Date, endDate: Date): string {
  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);
  return `analytics-${start}-to-${end}.csv`;
}
