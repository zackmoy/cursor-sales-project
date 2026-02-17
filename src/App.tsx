import { AnalyticsDashboard } from "./components/AnalyticsDashboard";

export default function App() {
  return (
    <main style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Analytics Dashboard</h1>
      <p style={{ color: "#666" }}>
        Mock product for the Signal-to-Code demo. The agent will add CSV export
        here.
      </p>
      <AnalyticsDashboard />
    </main>
  );
}
