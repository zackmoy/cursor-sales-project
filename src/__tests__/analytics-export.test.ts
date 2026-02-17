import { describe, it, expect } from "vitest";
import { AnalyticsService } from "../services/analytics-service";

describe("AnalyticsService Export", () => {
  const service = new AnalyticsService();

  it("exportToCsv returns valid CSV string", async () => {
    const csv = await service.exportToCsv({
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-03") },
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    });

    const lines = csv.split("\n");
    expect(lines).toHaveLength(4); // Header + 3 days

    // Check header
    expect(lines[0]).toBe("Date,activeUsers,events");

    // Check data rows
    const row1 = lines[1].split(",");
    expect(row1[0]).toBe("2026-02-01");
    expect(Number(row1[1])).toBeGreaterThanOrEqual(0);
    expect(Number(row1[2])).toBeGreaterThanOrEqual(0);
  });

  it("exportToCsv respects metric selection", async () => {
    const csv = await service.exportToCsv({
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-01") },
      metrics: ["sessions"],
      workspaceId: "ws-1",
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,sessions");
    expect(lines[1].split(",")).toHaveLength(2);
  });
});
