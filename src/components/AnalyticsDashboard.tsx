import { useState, useEffect, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QueryResult {
  data: Record<string, number[]>;
  labels: string[];
  totalRows: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVAILABLE_METRICS = [
  { key: "activeUsers", label: "Active Users", color: "var(--color-chart-1)" },
  { key: "events", label: "Events", color: "var(--color-chart-2)" },
  { key: "sessions", label: "Sessions", color: "var(--color-chart-3)" },
] as const;

const DEFAULT_WORKSPACE = "demo-workspace";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  change,
  color,
}: {
  label: string;
  value: string;
  change: number;
  color: string;
}) {
  const isPositive = change >= 0;
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricDot, backgroundColor: color }} />
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
      <p
        style={{
          ...styles.metricChange,
          color: isPositive ? "var(--color-success)" : "var(--color-danger)",
        }}
      >
        {isPositive ? "\u25B2" : "\u25BC"} {Math.abs(change).toFixed(1)}%
      </p>
    </div>
  );
}

function BarChart({
  labels,
  datasets,
  height = 220,
}: {
  labels: string[];
  datasets: { key: string; values: number[]; color: string }[];
  height?: number;
}) {
  if (labels.length === 0) return null;

  const allValues = datasets.flatMap((ds) => ds.values);
  const maxVal = Math.max(...allValues, 1);
  const barGroupWidth = 100 / labels.length;
  const gap = barGroupWidth * 0.4;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${labels.length * 32} ${height}`}
        style={{ width: "100%", minWidth: labels.length * 24, height }}
        preserveAspectRatio="none"
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1={0}
            x2={labels.length * 32}
            y1={height - frac * (height - 24)}
            y2={height - frac * (height - 24)}
            stroke="var(--color-border)"
            strokeWidth={0.5}
          />
        ))}

        {/* Bars */}
        {labels.map((_, li) =>
          datasets.map((ds, di) => {
            const val = ds.values[li] ?? 0;
            const barH = (val / maxVal) * (height - 24);
            const x = li * 32 + di * (32 / datasets.length) + gap / 2;
            return (
              <rect
                key={`${ds.key}-${li}`}
                x={x}
                y={height - barH}
                width={Math.max(1, 32 / datasets.length - 2)}
                height={barH}
                rx={2}
                fill={ds.color}
                opacity={0.85}
              >
                <title>
                  {labels[li]}: {formatNumber(val)}
                </title>
              </rect>
            );
          }),
        )}

        {/* X-axis labels (every 5th) */}
        {labels.map(
          (l, i) =>
            (i % Math.max(1, Math.floor(labels.length / 6)) === 0 ||
              i === labels.length - 1) && (
              <text
                key={i}
                x={i * 32 + 16}
                y={height}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-text-secondary)"
              >
                {l.slice(5)}
              </text>
            ),
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState("2026-02-01");
  const [endDate, setEndDate] = useState("2026-02-15");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);

  const selectedMetrics = useMemo(
    () => AVAILABLE_METRICS.map((m) => m.key),
    [],
  );

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          metrics: selectedMetrics,
          workspaceId: DEFAULT_WORKSPACE,
        }),
      });
      if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          metrics: selectedMetrics,
          workspaceId: DEFAULT_WORKSPACE,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`,
        );
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived stats for metric cards
  const metricSummaries = useMemo(() => {
    if (!result) return [];
    return AVAILABLE_METRICS.map((m) => {
      const series = result.data[m.key] ?? [];
      const total = series.reduce((a, b) => a + b, 0);
      const mid = Math.floor(series.length / 2);
      const firstHalf = series.slice(0, mid).reduce((a, b) => a + b, 0);
      const secondHalf = series.slice(mid).reduce((a, b) => a + b, 0);
      return {
        key: m.key,
        label: m.label,
        color: m.color,
        total,
        change: percentChange(secondHalf, firstHalf),
      };
    });
  }, [result]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics Dashboard</h1>
          <p style={styles.subtitle}>
            Workspace: <strong>{DEFAULT_WORKSPACE}</strong>
          </p>
        </div>
        <div style={styles.controls}>
          <div style={styles.dateGroup}>
            <label style={styles.dateLabel}>
              From
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.dateInput}
              />
            </label>
            <label style={styles.dateLabel}>
              To
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.dateInput}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Loading\u2026" : "Run Query"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            style={{
              ...styles.exportButton,
              opacity: exporting ? 0.6 : 1,
              cursor: exporting ? "wait" : "pointer",
            }}
          >
            {exporting ? "Exporting\u2026" : "\u2913 Export CSV"}
          </button>
        </div>
      </header>

      {/* Error */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Metric cards */}
      {result && (
        <div style={styles.cardRow}>
          {metricSummaries.map((m) => (
            <MetricCard
              key={m.key}
              label={m.label}
              value={formatNumber(m.total)}
              change={m.change}
              color={m.color}
            />
          ))}
          <MetricCard
            label="Date Range"
            value={`${result.totalRows} days`}
            change={0}
            color="var(--color-text-secondary)"
          />
        </div>
      )}

      {/* Chart */}
      {result && (
        <section style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h2 style={styles.chartTitle}>Daily Trends</h2>
            <div style={styles.legend}>
              {AVAILABLE_METRICS.map((m) => (
                <span key={m.key} style={styles.legendItem}>
                  <span
                    style={{
                      ...styles.legendDot,
                      backgroundColor: m.color,
                    }}
                  />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <BarChart
            labels={result.labels}
            datasets={AVAILABLE_METRICS.map((m) => ({
              key: m.key,
              values: result.data[m.key] ?? [],
              color: m.color,
            }))}
          />
        </section>
      )}

      {/* Raw data (collapsible) */}
      {result && (
        <details style={styles.detailsCard}>
          <summary style={styles.detailsSummary}>
            Raw JSON ({result.totalRows} rows &times;{" "}
            {Object.keys(result.data).length} metrics)
          </summary>
          <pre style={styles.pre}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline for zero-dep portability; the agent adds export here later)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1060,
    margin: "0 auto",
    padding: "24px 20px 48px",
  },

  // Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "var(--color-text)",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "var(--color-text-secondary)",
  },
  controls: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  dateGroup: { display: "flex", gap: 10 },
  dateLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    gap: 4,
  },
  dateInput: {
    padding: "6px 10px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius)",
    fontSize: 13,
    color: "var(--color-text)",
    background: "var(--color-surface)",
  },
  button: {
    padding: "8px 20px",
    border: "none",
    borderRadius: "var(--radius)",
    background: "var(--color-primary)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "var(--shadow-sm)",
  },
  exportButton: {
    padding: "8px 20px",
    border: "1px solid var(--color-primary)",
    borderRadius: "var(--radius)",
    background: "var(--color-primary-light)",
    color: "var(--color-primary)",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.2,
    boxShadow: "var(--shadow-sm)",
  },

  // Error
  errorBanner: {
    padding: "10px 14px",
    marginBottom: 16,
    borderRadius: "var(--radius)",
    background: "var(--color-danger-light)",
    color: "var(--color-danger)",
    fontSize: 13,
    fontWeight: 500,
  },

  // Metric cards
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    position: "relative",
    padding: "16px 18px",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-sm)",
  },
  metricDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  metricValue: {
    margin: "6px 0 2px",
    fontSize: 26,
    fontWeight: 700,
    color: "var(--color-text)",
    lineHeight: 1.1,
  },
  metricChange: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
  },

  // Chart card
  chartCard: {
    padding: "20px 20px 16px",
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-sm)",
    marginBottom: 20,
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 8,
  },
  chartTitle: { margin: 0, fontSize: 15, fontWeight: 600 },
  legend: { display: "flex", gap: 14, fontSize: 12 },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    color: "var(--color-text-secondary)",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },

  // Raw data
  detailsCard: {
    borderRadius: "var(--radius)",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-sm)",
  },
  detailsSummary: {
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    userSelect: "none" as const,
  },
  pre: {
    margin: 0,
    padding: "0 18px 16px",
    fontSize: 11,
    lineHeight: 1.5,
    overflow: "auto",
    maxHeight: 240,
    color: "var(--color-text-secondary)",
  },
};
