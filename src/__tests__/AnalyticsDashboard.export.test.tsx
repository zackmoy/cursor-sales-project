import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";

describe("AnalyticsDashboard export", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function getExportButton() {
    const buttons = screen.getAllByRole("button", { name: /export csv/i });
    return buttons[0];
  }

  it("shows Export CSV button on the analytics view", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { activeUsers: [1], events: [2], sessions: [3] },
        labels: ["2026-02-01"],
        totalRows: 1,
      }),
    });
    render(<AnalyticsDashboard />);
    await vi.waitFor(() => {
      expect(getExportButton()).toBeInTheDocument();
    });
  });

  it("Export CSV is enabled when date range is valid", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { activeUsers: [1], events: [2], sessions: [3] },
        labels: ["2026-02-01"],
        totalRows: 1,
      }),
    });
    render(<AnalyticsDashboard />);
    await vi.waitFor(() => {
      const exportBtn = getExportButton();
      expect(exportBtn).not.toBeDisabled();
    });
  });

  it("clicking Export CSV triggers POST to /api/export with current context", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { activeUsers: [1], events: [2], sessions: [3] },
          labels: ["2026-02-01"],
          totalRows: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["date,activeUsers"]),
        headers: new Headers({
          "Content-Disposition": 'attachment; filename="export-demo-2026-02-01-2026-02-15.csv"',
        }),
      });
    render(<AnalyticsDashboard />);
    await vi.waitFor(() => {
      expect(getExportButton()).not.toBeDisabled();
    });
    const exportBtn = getExportButton();
    fireEvent.click(exportBtn);
    await vi.waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/export",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("demo-workspace"),
        }),
      );
    });
  });

  it("shows error message when export request fails", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { activeUsers: [1], events: [2], sessions: [3] },
          labels: ["2026-02-01"],
          totalRows: 1,
        }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Server error" }) });
    render(<AnalyticsDashboard />);
    await vi.waitFor(() => {
      expect(getExportButton()).not.toBeDisabled();
    });
    fireEvent.click(getExportButton());
    await vi.waitFor(() => {
      expect(screen.getByText(/export failed/i)).toBeInTheDocument();
    });
  });
});
