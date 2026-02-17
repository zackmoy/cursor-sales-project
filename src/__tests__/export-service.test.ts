import { describe, it, expect } from "vitest";
import { ExportService, ExportValidationError } from "../services/export-service";

describe("ExportService", () => {
  const service = new ExportService();

  it("generates CSV with correct header row", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-02-01",
      endDate: "2026-02-03",
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,activeUsers,events");
  });

  it("generates correct number of data rows", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-02-01",
      endDate: "2026-02-05",
      metrics: ["activeUsers"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines).toHaveLength(6);
  });

  it("includes date labels in first column", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-02-10",
      endDate: "2026-02-12",
      metrics: ["sessions"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines[1]).toMatch(/^2026-02-10,/);
    expect(lines[2]).toMatch(/^2026-02-11,/);
    expect(lines[3]).toMatch(/^2026-02-12,/);
  });

  it("produces deterministic output for same inputs", async () => {
    const request = {
      startDate: "2026-02-01",
      endDate: "2026-02-05",
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    };
    const a = await service.generateCsv(request);
    const b = await service.generateCsv(request);
    expect(a).toBe(b);
  });

  it("handles single-day range", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-02-10",
      endDate: "2026-02-10",
      metrics: ["activeUsers"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("date,activeUsers");
  });

  it("includes all metrics as columns", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-02-01",
      endDate: "2026-02-01",
      metrics: ["activeUsers", "events", "sessions"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines[0]).toBe("date,activeUsers,events,sessions");
    const dataCols = lines[1].split(",");
    expect(dataCols).toHaveLength(4);
  });

  // --- Edge case / validation tests ---

  it("throws INVALID_START_DATE for garbage startDate", async () => {
    await expect(
      service.generateCsv({
        startDate: "not-a-date",
        endDate: "2026-02-15",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      }),
    ).rejects.toThrow(ExportValidationError);

    try {
      await service.generateCsv({
        startDate: "not-a-date",
        endDate: "2026-02-15",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });
    } catch (err) {
      expect((err as ExportValidationError).code).toBe("INVALID_START_DATE");
    }
  });

  it("throws INVALID_END_DATE for garbage endDate", async () => {
    await expect(
      service.generateCsv({
        startDate: "2026-02-01",
        endDate: "xyz",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      }),
    ).rejects.toThrow(ExportValidationError);
  });

  it("throws END_BEFORE_START when end < start", async () => {
    try {
      await service.generateCsv({
        startDate: "2026-02-15",
        endDate: "2026-02-01",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ExportValidationError);
      expect((err as ExportValidationError).code).toBe("END_BEFORE_START");
    }
  });

  it("throws RANGE_TOO_LARGE for > 90 day span", async () => {
    try {
      await service.generateCsv({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ExportValidationError);
      expect((err as ExportValidationError).code).toBe("RANGE_TOO_LARGE");
    }
  });

  it("allows exactly 90-day range", async () => {
    const csv = await service.generateCsv({
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      metrics: ["activeUsers"],
      workspaceId: "ws-1",
    });
    const lines = csv.split("\n");
    expect(lines).toHaveLength(91); // header + 90 days
  });

  it("throws UNKNOWN_METRICS for unrecognized metric names", async () => {
    try {
      await service.generateCsv({
        startDate: "2026-02-01",
        endDate: "2026-02-05",
        metrics: ["activeUsers", "bogusMetric"],
        workspaceId: "ws-1",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ExportValidationError);
      expect((err as ExportValidationError).code).toBe("UNKNOWN_METRICS");
      expect((err as ExportValidationError).message).toContain("bogusMetric");
    }
  });
});
