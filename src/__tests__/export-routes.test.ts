import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("POST /api/export", () => {
  it("returns 200 with CSV and correct headers for valid request", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        from: "2026-02-01",
        to: "2026-02-15",
        metrics: ["activeUsers", "events"],
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(
      /attachment;\s*filename="export-[^"]+\.csv"/,
    );
    expect(res.text).toMatch(/^date,activeUsers,events/);
    const lines = res.text.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it("returns 400 for invalid date range (end before start)", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo",
        from: "2026-02-15",
        to: "2026-02-01",
        metrics: ["activeUsers"],
      });
    expect(res.status).toBe(400);
    const body = res.body as { error?: string };
    expect(body.error).toBeDefined();
  });

  it("returns 400 for non-allowlisted metric", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo",
        from: "2026-02-01",
        to: "2026-02-15",
        metrics: ["activeUsers", "=CMD()"],
      });
    expect(res.status).toBe(400);
    const body = res.body as { error?: string; invalidMetrics?: string[] };
    expect(body.error).toMatch(/Invalid|disallowed/);
    expect(body.invalidMetrics).toContain("=CMD()");
  });

  it("returns 400 for invalid date format in filename", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo",
        from: "02/01/2026",
        to: "2026-02-15",
        metrics: ["activeUsers"],
      });
    expect(res.status).toBe(400);
  });
});
