import { describe, it, expect } from "vitest";
import { AnalyticsService, AnalyticsResult } from "../services/analytics-service";
import {
  validateMetrics,
  sanitizeFilename,
  buildCsv,
  ALLOWED_METRICS,
} from "../services/export-service";

describe("validateMetrics", () => {
  it("returns empty array for all valid metrics", () => {
    expect(validateMetrics(["activeUsers", "events"])).toEqual([]);
  });

  it("returns invalid metric names", () => {
    expect(validateMetrics(["activeUsers", "bogus", "=CMD()"])).toEqual([
      "bogus",
      "=CMD()",
    ]);
  });

  it("accepts every metric in the allowlist", () => {
    expect(validateMetrics([...ALLOWED_METRICS])).toEqual([]);
  });

  it("rejects empty string as a metric", () => {
    expect(validateMetrics([""])).toEqual([""]);
  });
});

describe("sanitizeFilename", () => {
  it("produces a clean filename from valid ISO dates", () => {
    expect(sanitizeFilename("2026-02-01", "2026-02-15")).toBe(
      "analytics-export-2026-02-01-to-2026-02-15.csv",
    );
  });

  it("strips path-traversal characters", () => {
    expect(sanitizeFilename("../../etc", "passwd")).toBe(
      "analytics-export-....etc-to-passwd.csv",
    );
  });

  it("strips header-injection characters", () => {
    expect(sanitizeFilename("2026-02-01\r\nX-Evil: yes", "2026-02-15")).toBe(
      "analytics-export-2026-02-01X-Evilyes-to-2026-02-15.csv",
    );
  });

  it("handles empty strings", () => {
    expect(sanitizeFilename("", "")).toBe("analytics-export--to-.csv");
  });
});

describe("buildCsv", () => {
  const service = new AnalyticsService();

  async function getResult(
    metrics: string[],
    start = "2026-02-01",
    end = "2026-02-03",
  ): Promise<AnalyticsResult> {
    return service.query({
      dateRange: { start: new Date(start), end: new Date(end) },
      metrics,
      workspaceId: "ws-test",
    });
  }

  it("produces correct header row with human-readable labels", async () => {
    const result = await getResult(["activeUsers", "events"]);
    const csv = buildCsv(result, ["activeUsers", "events"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,Active Users,Events");
  });

  it("produces one data row per day", async () => {
    const result = await getResult(["activeUsers"], "2026-02-01", "2026-02-03");
    const csv = buildCsv(result, ["activeUsers"]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(4); // 1 header + 3 data rows
    expect(lines[1]).toMatch(/^2026-02-01,/);
    expect(lines[2]).toMatch(/^2026-02-02,/);
    expect(lines[3]).toMatch(/^2026-02-03,/);
  });

  it("values match AnalyticsService.query() output exactly", async () => {
    const metrics = ["activeUsers", "events"];
    const result = await getResult(metrics);
    const csv = buildCsv(result, metrics);
    const lines = csv.split("\n");

    for (let i = 0; i < result.labels.length; i++) {
      const row = lines[i + 1].split(",");
      expect(row[0]).toBe(result.labels[i]);
      expect(Number(row[1])).toBe(result.data.activeUsers[i]);
      expect(Number(row[2])).toBe(result.data.events[i]);
    }
  });

  it("handles a single metric", async () => {
    const result = await getResult(["sessions"]);
    const csv = buildCsv(result, ["sessions"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,Sessions");
    expect(lines.length).toBe(4);
  });

  it("handles a single-day date range", async () => {
    const result = await getResult(
      ["activeUsers"],
      "2026-02-10",
      "2026-02-10",
    );
    const csv = buildCsv(result, ["activeUsers"]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // header + 1 row
    expect(lines[1]).toMatch(/^2026-02-10,/);
  });

  it("handles all six metrics", async () => {
    const allMetrics = [...ALLOWED_METRICS] as string[];
    const result = await getResult(allMetrics);
    const csv = buildCsv(result, allMetrics);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "date,Active Users,Events,Sessions,Page Views,API Calls,Error Rate",
    );
    // Each data row should have 7 columns (date + 6 metrics)
    const cols = lines[1].split(",");
    expect(cols.length).toBe(7);
  });
});
