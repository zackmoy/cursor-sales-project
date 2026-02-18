import { describe, it, expect } from "vitest";
import {
  buildCsv,
  getAllowedMetrics,
  sanitizeExportFilename,
  ALLOWED_EXPORT_METRICS,
} from "../services/export-service";
import type { AnalyticsResult } from "../services/analytics-service";

describe("export-service", () => {
  describe("getAllowedMetrics", () => {
    it("returns all allowed metric keys", () => {
      const allowed = getAllowedMetrics();
      expect(allowed).toEqual([...ALLOWED_EXPORT_METRICS]);
      expect(allowed).toContain("activeUsers");
      expect(allowed).toContain("events");
      expect(allowed).toContain("sessions");
    });
  });

  describe("buildCsv", () => {
    it("produces CSV with header row and data rows for allowlisted metrics", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01", "2026-02-02"],
        data: {
          activeUsers: [100, 120],
          events: [500, 600],
        },
        totalRows: 2,
      };
      const csv = buildCsv(result, ["activeUsers", "events"]);
      expect(csv).toContain("date,activeUsers,events");
      expect(csv).toContain("2026-02-01,100,500");
      expect(csv).toContain("2026-02-02,120,600");
      const lines = csv.split("\n");
      expect(lines).toHaveLength(3);
    });

    it("excludes non-allowlisted metrics from output", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01"],
        data: { activeUsers: [100], badMetric: [999] },
        totalRows: 1,
      };
      const csv = buildCsv(result, ["activeUsers", "badMetric"]);
      expect(csv).not.toContain("badMetric");
      expect(csv).toContain("date,activeUsers");
    });

    it("throws when no allowlisted metrics are requested", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01"],
        data: {},
        totalRows: 1,
      };
      expect(() => buildCsv(result, ["unknownMetric"])).toThrow("No allowlisted metrics");
    });

    it("escapes CSV cells containing comma", () => {
      const result: AnalyticsResult = {
        labels: ["2026-02-01"],
        data: { activeUsers: [100] },
        totalRows: 1,
      };
      const csv = buildCsv(result, ["activeUsers"]);
      expect(csv).toBe("date,activeUsers\n2026-02-01,100");
    });
  });

  describe("sanitizeExportFilename", () => {
    it("returns filename with only safe characters", () => {
      const name = sanitizeExportFilename("ws-1", "2026-02-01", "2026-02-15");
      expect(name).toBe("export-ws-1-2026-02-01-2026-02-15.csv");
      expect(name).toMatch(/^[a-zA-Z0-9._-]+\.csv$/);
    });

    it("strips invalid characters from workspace id", () => {
      const name = sanitizeExportFilename("ws/../../etc", "2026-02-01", "2026-02-01");
      expect(name).not.toContain("/");
      expect(name).toMatch(/^export-[a-zA-Z0-9._-]+\.csv$/);
    });

    it("throws for invalid date format", () => {
      expect(() =>
        sanitizeExportFilename("ws", "02-01-2026", "2026-02-15"),
      ).toThrow(/Invalid date/);
      expect(() =>
        sanitizeExportFilename("ws", "2026-02-01", "not-a-date"),
      ).toThrow(/Invalid date/);
    });

    it("accepts valid ISO date strings", () => {
      const name = sanitizeExportFilename("demo", "2026-01-01", "2026-12-31");
      expect(name).toBe("export-demo-2026-01-01-2026-12-31.csv");
    });
  });
});
