import { AnalyticsDashboard } from "./components/AnalyticsDashboard";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      <nav
        style={{
          padding: "10px 24px",
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        <span style={{ fontSize: 18 }}>&#9678;</span>
        Acme Analytics
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 400,
            color: "var(--color-text-secondary)",
          }}
        >
          Enterprise &middot; 150 seats
        </span>
      </nav>
      <AnalyticsDashboard />
    </div>
  );
}
