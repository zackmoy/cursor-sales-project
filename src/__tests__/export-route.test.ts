import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import { AnalyticsService } from "../services/analytics-service";

describe("POST /api/export", () => {
  const validBody = {
    startDate: "2026-02-01",
    endDate: "2026-02-15",
    metrics: ["activeUsers", "events"],
    workspaceId: "ws-1",
  };

  it("returns 200 with text/csv content type for valid request", async () => {
    const res = await request(app).post("/api/export").send(validBody);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
  });

  it("includes Content-Disposition header with sanitized filename", async () => {
    const res = await request(app).post("/api/export").send(validBody);

    expect(res.headers["content-disposition"]).toBe(
      'attachment; filename="analytics-export-2026-02-01-to-2026-02-15.csv"',
    );
  });

  it("CSV body has correct header row and row count", async () => {
    const res = await request(app).post("/api/export").send(validBody);
    const lines = res.text.split("\n");

    expect(lines[0]).toBe("date,Active Users,Events");
    // 15 days: Feb 1 to Feb 15
    expect(lines.length).toBe(16); // 1 header + 15 data rows
  });

  it("CSV values match AnalyticsService.query() output", async () => {
    const service = new AnalyticsService();
    const result = await service.query({
      dateRange: { start: new Date("2026-02-01"), end: new Date("2026-02-15") },
      metrics: ["activeUsers", "events"],
      workspaceId: "ws-1",
    });

    const res = await request(app).post("/api/export").send(validBody);
    const lines = res.text.split("\n");

    for (let i = 0; i < result.labels.length; i++) {
      const row = lines[i + 1].split(",");
      expect(row[0]).toBe(result.labels[i]);
      expect(Number(row[1])).toBe(result.data.activeUsers[i]);
      expect(Number(row[2])).toBe(result.data.events[i]);
    }
  });

  it("returns 400 for missing fields", async () => {
    const res = await request(app).post("/api/export").send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for missing metrics array", async () => {
    const res = await request(app).post("/api/export").send({
      startDate: "2026-02-01",
      endDate: "2026-02-15",
      workspaceId: "ws-1",
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid metric names", async () => {
    const res = await request(app).post("/api/export").send({
      ...validBody,
      metrics: ["activeUsers", "hackerMetric"],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid metrics/);
    expect(res.body.error).toMatch(/hackerMetric/);
  });

  it("returns 400 for CSV-injection metric names", async () => {
    const res = await request(app).post("/api/export").send({
      ...validBody,
      metrics: ["=CMD()"],
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid metrics/);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await request(app).post("/api/export").send({
      ...validBody,
      startDate: "not-a-date",
    });

    expect(res.status).toBe(400);
  });

  it("handles 1-day date range correctly", async () => {
    const res = await request(app).post("/api/export").send({
      ...validBody,
      startDate: "2026-02-10",
      endDate: "2026-02-10",
    });

    expect(res.status).toBe(200);
    const lines = res.text.split("\n");
    expect(lines.length).toBe(2); // header + 1 data row
    expect(lines[1]).toMatch(/^2026-02-10,/);
  });

  it("handles 90+ day date range correctly", async () => {
    const res = await request(app).post("/api/export").send({
      ...validBody,
      startDate: "2026-01-01",
      endDate: "2026-03-31",
    });

    expect(res.status).toBe(200);
    const lines = res.text.split("\n");
    // Jan 1 to Mar 31 = 90 days; row count may vary by +-1 due to TZ
    expect(lines.length).toBeGreaterThanOrEqual(90);
    expect(lines.length).toBeLessThanOrEqual(92);
    expect(lines[0]).toBe("date,Active Users,Events");
    expect(lines[1]).toMatch(/^2026-01-01,/);
  });
});
