import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../services/analytics-service";

describe("AnalyticsService", () => {
  const service = new AnalyticsService();

  it("returns result with requested metrics and correct day count", async () => {
    const result = await service.query({
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-15") },
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    });
    expect(result.totalRows).toBe(15);
    expect(result.labels).toHaveLength(15);
    expect(result.labels[0]).toBe("2026-02-01");
    expect(result.labels[14]).toBe("2026-02-15");
    expect(Object.keys(result.data)).toEqual(["activeUsers", "events"]);
    expect(result.data.activeUsers).toHaveLength(15);
    expect(result.data.events).toHaveLength(15);
  });

  it("returns deterministic data for the same query", async () => {
    const query = {
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-15") },
      metrics: ["activeUsers"],
      workspaceId: "ws-1",
    };
    const a = await service.query(query);
    const b = await service.query(query);
    expect(a.data.activeUsers).toEqual(b.data.activeUsers);
  });

  it("handles single-day range", async () => {
    const result = await service.query({
      dateRange: { start: new Date("2026-02-10"), end: new Date("2026-02-10") },
      metrics: ["sessions"],
      workspaceId: "ws-1",
    });
    expect(result.totalRows).toBe(1);
    expect(result.labels).toEqual(["2026-02-10"]);
    expect(result.data.sessions).toHaveLength(1);
  });

  it("produces non-negative values", async () => {
    const result = await service.query({
      dateRange: { start: new Date("2026-01-01"), end: new Date("2026-02-28") },
      metrics: ["activeUsers", "events", "sessions"],
      workspaceId: "ws-1",
    });
    for (const metric of Object.values(result.data)) {
      for (const val of metric) {
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
