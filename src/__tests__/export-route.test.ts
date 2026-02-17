import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import exportRoutes from "../api/routes/export";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", exportRoutes);
  return app;
}

describe("POST /api/export", () => {
  const app = createApp();

  // --- Happy path ---

  it("returns CSV with correct content-type", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2026-02-01",
        endDate: "2026-02-03",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
  });

  it("returns CSV with correct header and row count", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2026-02-01",
        endDate: "2026-02-05",
        metrics: ["activeUsers", "events"],
        workspaceId: "ws-1",
      });

    const lines = res.text.split("\n");
    expect(lines[0]).toBe("date,activeUsers,events");
    expect(lines).toHaveLength(6);
  });

  it("sets Content-Disposition header for file download", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        metrics: ["sessions"],
        workspaceId: "ws-1",
      });

    expect(res.headers["content-disposition"]).toContain("analytics-export");
    expect(res.headers["content-disposition"]).toContain(".csv");
  });

  // --- Zod schema validation (missing fields) ---

  it("returns 400 with VALIDATION_ERROR for missing startDate", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({ endDate: "2026-02-15", metrics: ["activeUsers"], workspaceId: "ws-1" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty metrics array", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({ startDate: "2026-02-01", endDate: "2026-02-15", metrics: [], workspaceId: "ws-1" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing workspaceId", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({ startDate: "2026-02-01", endDate: "2026-02-15", metrics: ["activeUsers"] });

    expect(res.status).toBe(400);
  });

  // --- Business logic validation (ExportValidationError) ---

  it("returns 400 RANGE_TOO_LARGE for > 90 day span", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("RANGE_TOO_LARGE");
    expect(res.body.error.message).toContain("90");
  });

  it("returns 400 END_BEFORE_START when end < start", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2026-02-15",
        endDate: "2026-02-01",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("END_BEFORE_START");
  });

  it("returns 400 INVALID_START_DATE for unparseable date", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "not-a-date",
        endDate: "2026-02-15",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_START_DATE");
  });

  it("returns 400 UNKNOWN_METRICS for unrecognized metric", async () => {
    const res = await request(app)
      .post("/api/export")
      .send({
        startDate: "2026-02-01",
        endDate: "2026-02-05",
        metrics: ["activeUsers", "hackerMetric"],
        workspaceId: "ws-1",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("UNKNOWN_METRICS");
    expect(res.body.error.message).toContain("hackerMetric");
  });
});
