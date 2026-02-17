import { AnalyticsResult } from "./analytics-service.js";

/**
 * Hardcoded allowlist of metric keys that can appear in exports.
 * Must match the keys produced by AnalyticsService.
 */
export const ALLOWED_METRICS = [
  "activeUsers",
  "events",
  "sessions",
  "pageViews",
  "apiCalls",
  "errorRate",
] as const;

export type AllowedMetric = (typeof ALLOWED_METRICS)[number];

const ALLOWED_METRICS_SET: ReadonlySet<string> = new Set(ALLOWED_METRICS);

/**
 * Human-readable labels for CSV column headers, matching the dashboard UI.
 */
const METRIC_LABELS: Record<AllowedMetric, string> = {
  activeUsers: "Active Users",
  events: "Events",
  sessions: "Sessions",
  pageViews: "Page Views",
  apiCalls: "API Calls",
  errorRate: "Error Rate",
};

/**
 * Validate that every requested metric is in the allowlist.
 * Returns an array of invalid metric names (empty = all valid).
 */
export function validateMetrics(metrics: string[]): string[] {
  return metrics.filter((m) => !ALLOWED_METRICS_SET.has(m));
}

/**
 * Strip characters outside [a-zA-Z0-9._-] from each date component
 * and build a safe filename for the CSV download.
 */
export function sanitizeFilename(startDate: string, endDate: string): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z0-9._-]/g, "");
  return `analytics-export-${clean(startDate)}-to-${clean(endDate)}.csv`;
}

/**
 * Build a CSV string from an AnalyticsResult.
 *
 * Format:
 *   date,Active Users,Events,...
 *   2026-02-01,1240,48500,...
 *   2026-02-02,1255,49100,...
 */
export function buildCsv(
  result: AnalyticsResult,
  metrics: string[],
): string {
  const headerLabels = metrics.map(
    (m) => METRIC_LABELS[m as AllowedMetric] ?? m,
  );
  const header = ["date", ...headerLabels].join(",");

  const rows = result.labels.map((dateLabel, i) => {
    const values = metrics.map((m) => {
      const series = result.data[m];
      return series ? String(series[i]) : "";
    });
    return [dateLabel, ...values].join(",");
  });

  return [header, ...rows].join("\n");
}
