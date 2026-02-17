/**
 * Smoke test: starts the full Express app on a random port, hits POST /api/export,
 * and verifies the CSV response end-to-end over real HTTP.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { app } from "../app";

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe("Smoke: POST /api/export (full HTTP stack)", () => {
  it("returns a valid CSV with correct headers and row count", async () => {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2026-02-01",
        endDate: "2026-02-07",
        metrics: ["activeUsers", "events"],
        workspaceId: "ws-1",
      }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toContain(".csv");

    const csv = await res.text();
    const lines = csv.split("\n");

    expect(lines[0]).toBe("date,activeUsers,events");
    expect(lines).toHaveLength(8); // header + 7 days
    expect(lines[1]).toMatch(/^2026-02-01,[\d.]+,[\d.]+$/);
    expect(lines[7]).toMatch(/^2026-02-07,[\d.]+,[\d.]+$/);
  });

  it("returns structured 400 for date range > 90 days", async () => {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("RANGE_TOO_LARGE");
  });

  it("returns structured 400 for unknown metric", async () => {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2026-02-01",
        endDate: "2026-02-05",
        metrics: ["activeUsers", "fakeMetric"],
        workspaceId: "ws-1",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("UNKNOWN_METRICS");
  });

  it("returns structured 400 for end before start", async () => {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: "2026-02-15",
        endDate: "2026-02-01",
        metrics: ["activeUsers"],
        workspaceId: "ws-1",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("END_BEFORE_START");
  });
});
