import { useState } from "react";

const DEFAULT_METRICS = ["activeUsers", "events", "sessions"];
const DEFAULT_WORKSPACE = "demo-workspace";

export function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState("2026-02-01");
  const [endDate, setEndDate] = useState("2026-02-15");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    data: Record<string, number[]>;
    labels: string[];
    totalRows: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleQuery() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          metrics: DEFAULT_METRICS,
          workspaceId: DEFAULT_WORKSPACE,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "1rem",
        background: "#fff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Query analytics</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ display: "block", marginTop: 4, padding: 6 }}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ display: "block", marginTop: 4, padding: 6 }}
          />
        </label>
        <div style={{ alignSelf: "flex-end" }}>
          <button
            type="button"
            onClick={handleQuery}
            disabled={loading}
            style={{ padding: "8px 16px", cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? "Loading…" : "Run query"}
          </button>
        </div>
      </div>
      {error && (
        <p style={{ color: "#c00", margin: "0 0 1rem 0" }}>{error}</p>
      )}
      {result && (
        <div>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            <strong>{result.totalRows}</strong> rows, metrics:{" "}
            {Object.keys(result.data).join(", ")}
          </p>
          <pre
            style={{
              margin: 0,
              padding: "0.75rem",
              background: "#f5f5f5",
              borderRadius: 4,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 200,
            }}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
