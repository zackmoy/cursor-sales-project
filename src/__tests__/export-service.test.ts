import { describe, it, expect } from "vitest";
import {
  buildCsvFromResult,
  buildExportFilename,
  isAllowedMetric,
  filterAllowedMetrics,
} from "../services/export-service";
import type { AnalyticsResult } from "../services/analytics-service";

describe("export-service", () => {
  describe("isAllowedMetric", () => {
    it("returns true for allowlisted metrics", () => {
      expect(isAllowedMetric("activeUsers")).toBe(true);
      expect(isAllowedMetric("events")).toBe(true);
      expect(isAllowedMetric("sessions")).toBe(true);
      expect(isAllowedMetric("errorRate")).toBe(true);
    });

    it("returns false for non-allowlisted metrics", () => {
      expect(isAllowedMetric("=CMD()")).toBe(false);
      expect(isAllowedMetric("unknown")).toBe(false);
    });
  });

  describe("filterAllowedMetrics", () => {
    it("returns only requested metrics that are allowed and in result", () => {
      const requested = ["activeUsers", "events", "=CMD()", "sessions"];
      const resultKeys = ["activeUsers", "events", "sessions"];
      expect(filterAllowedMetrics(requested, resultKeys)).toEqual([
        "activeUsers",
        "events",
        "sessions",
      ]);
    });
  });

  describe("buildCsvFromResult", () => {
    it("produces CSV with date column and metric columns", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01", "2026-02-02"],
        data: {
          activeUsers: [100, 120],
          events: [500, 600],
        },
        totalRows: 2,
      };
      const csv = buildCsvFromResult(result, ["activeUsers", "events"]);
      expect(csv).toContain("date,activeUsers,events");
      expect(csv).toContain("2026-02-01,100,500");
      expect(csv).toContain("2026-02-02,120,600");
    });

    it("includes only allowlisted requested metrics present in result", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01"],
        data: { activeUsers: [100] },
        totalRows: 1,
      };
      const csv = buildCsvFromResult(result, ["activeUsers", "events"]);
      expect(csv).toContain("date,activeUsers");
      expect(csv).not.toContain("events");
    });

    it("returns header-only when no allowed metrics in result", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01"],
        data: {},
        totalRows: 1,
      };
      const csv = buildCsvFromResult(result, []);
      expect(csv).toBe("date\n");
    });
  });

  describe("buildExportFilename", () => {
    it("returns filename with only safe characters", () => {
      const start = new Date("2026-02-01");
      const end = new Date("2026-02-15");
      const name = buildExportFilename(start, end);
      expect(name).toMatch(/^[a-zA-Z0-9._-]+\.csv$/);
      expect(name).toBe("analytics-2026-02-01-to-2026-02-15.csv");
    });

    it("uses ISO date slice for single day", () => {
      const d = new Date("2026-03-10");
      const name = buildExportFilename(d, d);
      expect(name).toContain("2026-03-10");
      expect(name).toContain(".csv");
    });
  });
});
