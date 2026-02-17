import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../services/analytics-service";

describe("AnalyticsService", () => {
  const service = new AnalyticsService();

  it("returns result with requested metrics", async () => {
    const result = await service.query({
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-15") },
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    });
    expect(result.totalRows).toBe(30);
    expect(result.labels).toHaveLength(30);
    expect(Object.keys(result.data)).toEqual(["activeUsers", "events"]);
    expect(result.data.activeUsers).toHaveLength(30);
    expect(result.data.events).toHaveLength(30);
  });
});
