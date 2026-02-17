import { AnalyticsService, type AnalyticsQuery } from "./analytics-service.js";

export interface ExportRequest {
  startDate: string;
  endDate: string;
  metrics: string[];
  workspaceId: string;
}

export class ExportValidationError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ExportValidationError";
    this.code = code;
  }
}

const MAX_EXPORT_DAYS = 90;
const ALLOWED_METRICS = ["activeUsers", "events", "sessions"];

/**
 * Generates a CSV string from analytics data.
 * Header row: "date" followed by each metric name.
 * Data rows: one per day, values matching the dashboard display.
 *
 * Validates dates, metrics, and range limits before querying.
 */
export class ExportService {
  private analyticsService: AnalyticsService;

  constructor(analyticsService?: AnalyticsService) {
    this.analyticsService = analyticsService ?? new AnalyticsService();
  }

  async generateCsv(request: ExportRequest): Promise<string> {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);

    if (Number.isNaN(start.getTime())) {
      throw new ExportValidationError(
        "INVALID_START_DATE",
        `Invalid startDate: "${request.startDate}". Use ISO format (YYYY-MM-DD).`,
      );
    }
    if (Number.isNaN(end.getTime())) {
      throw new ExportValidationError(
        "INVALID_END_DATE",
        `Invalid endDate: "${request.endDate}". Use ISO format (YYYY-MM-DD).`,
      );
    }
    if (end < start) {
      throw new ExportValidationError(
        "END_BEFORE_START",
        `endDate (${request.endDate}) is before startDate (${request.startDate}).`,
      );
    }

    const days =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days > MAX_EXPORT_DAYS) {
      throw new ExportValidationError(
        "RANGE_TOO_LARGE",
        `Date range spans ${days} days. Maximum allowed is ${MAX_EXPORT_DAYS}. Narrow the range or contact your admin for bulk access.`,
      );
    }

    const unknownMetrics = request.metrics.filter(
      (m) => !ALLOWED_METRICS.includes(m),
    );
    if (unknownMetrics.length > 0) {
      throw new ExportValidationError(
        "UNKNOWN_METRICS",
        `Unknown metric(s): ${unknownMetrics.join(", ")}. Allowed: ${ALLOWED_METRICS.join(", ")}.`,
      );
    }

    const query: AnalyticsQuery = {
      dateRange: { start, end },
      metrics: request.metrics,
      workspaceId: request.workspaceId,
    };

    const result = await this.analyticsService.query(query);

    const header = ["date", ...request.metrics].join(",");

    const rows = result.labels.map((label, i) => {
      const values = request.metrics.map((m) => {
        const series = result.data[m];
        return series ? String(series[i]) : "";
      });
      return [label, ...values].join(",");
    });

    return [header, ...rows].join("\n");
  }
}
