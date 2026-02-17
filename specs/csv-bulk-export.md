# Feature Spec: CSV Bulk Export for Analytics Dashboard

## Origin (Multi-Source Attribution)

| Source | Evidence | Signal |
|--------|----------|--------|
| **Gong** | 3 calls: Acme Corp (call-001, Feb 10), Stark Industries (call-003, Feb 13), Beta Inc (call-004, Feb 14) | Pain: manual screenshotting, board reporting blocked, renewal at risk |
| **Canny** | "Bulk CSV export from analytics dashboard" — 47 upvotes (req-csv-001). Related: "Scheduled CSV export via API" — 18 upvotes (req-api-005) | Top-voted request; 7 voter companies including Acme, Stark, Initech |
| **Zendesk** | 5 tickets (zd-001, zd-002, zd-003, zd-004, zd-006) across Acme Corp, Initech, Stark Industries | Workaround patterns: screenshotting charts, dev-tools copy-paste |

**Signal Strength:** 🔴 CRITICAL — appears in all 3 sources, deal-blocking for Acme Corp (Enterprise, 150 seats, 30-seat expansion pending), renewal risk for Beta Inc.

**Primary Requestor:** Jane Smith, VP of Engineering, Acme Corp (Enterprise tier)

**Competitive Context:** Datadog mentioned as comparison on Gong call-001 — "Datadog lets us do this and we're getting pressure to switch."

## Problem Statement

Enterprise customers with analytics dashboards cannot export data for external reporting. They are manually screenshotting charts and copying numbers into spreadsheets. Support tickets reveal this is a recurring workaround pattern across multiple companies, not a one-off request.

## Customer Quotes

- **Jane Smith (Acme Corp, Gong call-001):** "My analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It's embarrassing."
- **Jane Smith (Acme Corp, Gong call-001):** "If we can't export by then, I'll have to escalate to my CTO and we might need to evaluate alternatives."
- **Anna Reyes (Stark Industries, Gong call-003):** "We have the same problem Jane at Acme mentioned — we need CSV export badly. Our data team runs quarterly reviews and right now they're screen-scraping the dashboard."
- **James Obi (Stark Industries, Gong call-003):** "We need to be able to export filtered data — not just the full dump, but what's on screen after we apply date range and metric filters."
- **Jane Smith (Acme Corp, Zendesk zd-001):** "We need this for board reporting. Currently screenshotting charts."

## Requirements

1. User can select a date range and metrics, then export the displayed data as a CSV file.
2. CSV export uses the current dashboard date range and selected metrics (filtered data, not a full dump).
3. Export generates a downloadable `.csv` file with column headers matching the dashboard metric labels.
4. The export endpoint validates inputs (date range, metrics, workspace) using Zod.
5. Export integrates with the existing `AnalyticsService` — no separate data pipeline.

## Acceptance Criteria

- [ ] An "Export CSV" button is visible on the analytics dashboard at all times (not gated on running a query first).
- [ ] Clicking "Export CSV" triggers a download of a `.csv` file.
- [ ] The CSV contains a header row with "date" plus the selected metric names.
- [ ] The CSV data rows match the current date range and metrics.
- [ ] The export API returns 400 for invalid inputs (missing dates, empty metrics).
- [ ] The export API returns a valid CSV content-type (`text/csv`).

## Test Requirements

- **Unit tests** for the export service: CSV formatting, header generation, data correctness.
- **Integration tests** for `POST /api/export`: valid request returns CSV, invalid request returns 400, content-type is `text/csv`.
- Tests map to acceptance criteria: e.g. "AC: CSV contains header row" → unit test for CSV header generation; "AC: 400 for invalid inputs" → integration test with missing fields.

## Technical Constraints

- **Backend:** Integrate with `AnalyticsService` in `src/services/analytics-service.ts`. New export service in `src/services/export-service.ts`. New route in `src/api/routes/export.ts`.
- **Frontend:** Update `src/components/AnalyticsDashboard.tsx` to add an "Export CSV" button that calls the export API.
- **Validation:** Zod schema for export request body (consistent with existing analytics route pattern).
- **Stack:** Express, TypeScript, Zod, vitest.

## UI / Frontend

- **Component:** `src/components/AnalyticsDashboard.tsx` (existing, updated).
- **New control:** "Export CSV" button in the dashboard header controls area, next to the "Run Query" button.
- **Visibility:** Always visible. Uses the current `startDate`, `endDate`, and selected metrics.
- **Behavior:** Clicking triggers a `POST /api/export`, receives a CSV blob, and initiates a browser download.
- **Loading state:** Button shows "Exporting..." while the request is in flight; disabled during export.

## Stakeholder Routing

- **AE:** Mike Chen (@mike-chen) — on Acme and Stark calls; Acme expansion (30 seats) depends on this.
- **AE:** Lisa Park (@lisa-park) — on Beta Inc renewal call; renewal at risk without export.
- **SE:** Sarah Lee (@sarah-lee) — on Acme call; technical context on requirements.

## AI Attribution

- **Signal triangulation:** Cursor Agent (Gong + Canny + Zendesk MCPs)
- **Spec generation:** Cursor Agent (from multi-source analysis, governed by signal-analysis and spec-template rules)
- **Human review required:** Yes — spec approval before code generation
