import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../app.js";

describe("POST /api/export", () => {
  it("returns 200 with CSV body and correct headers for valid request", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        metrics: ["activeUsers", "events"],
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.headers["content-disposition"]).toMatch(
      /filename="analytics-2026-02-01-to-2026-02-15\.csv"/,
    );

    const body = res.text;
    expect(body).toContain("date,activeUsers,events");
    expect(body).toContain("2026-02-01");
    expect(body).toContain("2026-02-15");
    const lines = body.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines[0]).toBe("date,activeUsers,events");
  });

  it("returns 400 for invalid date range (end before start)", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        startDate: "2026-02-15",
        endDate: "2026-02-01",
        metrics: ["activeUsers"],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("returns 400 for non-ISO date format", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        startDate: "02/01/2026",
        endDate: "2026-02-15",
        metrics: ["activeUsers"],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for empty metrics", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        metrics: [],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 for non-allowlisted metric", async () => {
    const res = await request(app)
      .post("/api/export")
      .set("Content-Type", "application/json")
      .send({
        workspaceId: "demo-workspace",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        metrics: ["activeUsers", "=CMD()"],
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
