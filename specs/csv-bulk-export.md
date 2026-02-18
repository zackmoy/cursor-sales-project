# Bulk CSV export from analytics dashboard

## Origin (Multi-Source Attribution)

| Source   | Identifier(s) | Signal strength |
|----------|----------------|-----------------|
| **Gong** | (No calls in signal window 2025-02-03 → 2025-02-17) | — |
| **Canny** | Request `553c3ef8b8cdcd1501ba4001` — "Bulk CSV export from analytics dashboard" — 47 votes, author Jane Smith (Acme Corp), voters include Acme Corp, Stark Industries, Wayne Enterprises, Umbrella Corp, Cyberdyne, Initech, Beta Inc | **Critical** |
| **Zendesk** | Tickets 35001, 35003, 35004, 35006 — export/CSV/reporting; org 509974 multiple + urgent "Q1 board deck" | **Critical** |

**Weighting:** Existing Enterprise customers (Acme, Stark) drive Canny votes; Zendesk shows repeated and urgent demand ("blocking our Q1 board review," "no way to get data out programmatically"). Triangulation = **Critical**.

---

## Problem Statement

Customers need to export analytics data as CSV for board reporting, quarterly reviews, and external analysis. Today there is no way to get data out of the dashboard programmatically; the gap blocks board workflows and forces workarounds (e.g. copy-paste from the UI), which lose formatting and scale poorly.

---

## Customer Quotes

- "We need to export analytics data as CSV for our board reporting workflow. Currently we have no way to get data out of the dashboard programmatically." (Zendesk 35001)
- "Same request as our Canny vote — CSV export from analytics dashboard is blocking our Q1 board review." (Zendesk 35003)
- "Ability to select date range and metrics, then export all data as CSV for board reporting and external analysis. Many enterprise customers need this for quarterly reviews." (Canny 553c3ef8b8cdcd1501ba4001)
- "We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month." (Zendesk 35004)

---

## Requirements

1. **Export API:** Add an export endpoint (e.g. `POST /api/analytics/export` or `POST /api/export`) that accepts the same query parameters as the existing analytics query (workspaceId, date range, metrics), validates them (Zod), and returns a CSV response with `Content-Type: text/csv` and a safe `Content-Disposition` filename (see Architecture Review).
2. **CSV shape:** CSV must include a date column (from the query date range) and one column per requested metric; metric names in headers must be allowlisted to prevent CSV injection.
3. **Backend integration:** Export must use the existing `AnalyticsService` (e.g. call `query()` then convert result to CSV); no new persistence.
4. **UI:** Add an "Export CSV" control (e.g. button) on the analytics dashboard that uses the current date range and selected metrics, calls the export API, and triggers a file download. Control is visible when the user can run a query (same visibility as the existing query flow) and is enabled when the current selection is valid (date range + at least one metric).
5. **Security:** Filenames and CSV content must not incorporate unsanitized user input; date strings must be validated as ISO dates when used in filenames; metric names must be checked against an allowlist before inclusion in headers (see Architecture Review).

---

## Acceptance Criteria

- [ ] **AC: Export endpoint** — POST to the export endpoint with valid workspaceId, startDate, endDate (ISO), and metrics returns HTTP 200 with body that is valid CSV and response headers include `Content-Type: text/csv` and `Content-Disposition: attachment; filename="..."` with a safe filename (e.g. derived from validated date range only, no user-supplied free text).
- [ ] **AC: CSV content** — CSV has a date column and one column per requested metric; metric names in headers appear only if they are in the allowlist; rows match the date range and data from `AnalyticsService.query()`.
- [ ] **AC: Invalid request** — Invalid body (e.g. invalid dates, empty metrics, or metrics not in allowlist) returns 400 with a structured error; no CSV is returned.
- [ ] **AC: Export button in UI** — Dashboard shows an "Export CSV" control when the user can run a query; it is enabled when date range and at least one metric are selected; clicking it requests the export with the current date range and selected metrics and triggers a download of the returned CSV file.
- [ ] **AC: Filename safety** — Filename in `Content-Disposition` contains only characters in `[a-zA-Z0-9._-]` and is derived from validated server-side values (e.g. date range), not from arbitrary user input.

---

## Test Requirements

- **Unit:** CSV builder / export helper that turns `AnalyticsResult` + allowlisted metric names into a CSV string; test with sample data and assert header row and numeric formatting. Map to AC: CSV content.
- **Unit:** Filename/sanitization helper: given validated date range, produces a safe filename; test that no user-supplied free text or disallowed characters appear. Map to AC: Filename safety.
- **Integration:** Export route: valid request → 200, `Content-Type: text/csv`, `Content-Disposition` with safe filename, body parseable as CSV with expected columns. Map to AC: Export endpoint, AC: CSV content.
- **Integration:** Export route: invalid body (bad dates, empty metrics, non-allowlisted metric) → 400. Map to AC: Invalid request.
- **Component (optional but recommended):** Dashboard: "Export CSV" is visible and enabled when selection is valid; click triggers request and download (can mock fetch). Map to AC: Export button in UI.

---

## Technical Constraints

- **Backend:** Reuse `AnalyticsService` in `src/services/analytics-service.ts` for data; add export route under `src/api/routes/` (e.g. `analytics.ts` or dedicated `export.ts`) and register in `src/app.ts`. Use Zod for request validation; keep export logic in a small helper or service method that converts `AnalyticsResult` to CSV.
- **Frontend:** Extend `src/components/AnalyticsDashboard.tsx` (or equivalent dashboard component) to add the Export CSV control; use the same workspaceId, date range, and metrics as the current query when calling the export API.
- **Performance:** Export uses the same query path as the dashboard; consider existing limits (e.g. max date range) if documented; no new persistence or background jobs in scope.

---

## UI / Frontend

- **Components/pages:** `src/components/AnalyticsDashboard.tsx` (or the main analytics dashboard component).
- **Behavior:** An "Export CSV" button (or equivalent control) is shown in the same area as the existing query controls (e.g. near the date range and metric selection). It is **visible** whenever the user can run an analytics query. It is **enabled** when the current date range is valid and at least one metric is selected (same validity as running a query). On click, the app calls the export API with the current workspaceId, startDate, endDate, and selected metrics, then triggers a file download (e.g. via blob + temporary link or `Content-Disposition` handling). No export is possible without a valid selection; the control is disabled otherwise.

---

## Architecture Review

- [ ] **NEEDS_DESIGN_REVIEW:** Not triggered. Export is stateless: same query path as dashboard, response returned in request; no new persistence.
- [ ] **NEEDS_SECURITY_REVIEW:** **Triggered (Gate 4 — Input-Driven Output).** Export uses user-supplied date range and metric names. **Mitigation:** (1) Filename in `Content-Disposition` must be derived only from validated, server-side values (e.g. validated ISO date range); sanitize to `[a-zA-Z0-9._-]`. (2) Validate date strings as ISO dates before use anywhere. (3) Allowlist metric names before including them in CSV headers to prevent CSV injection (e.g. `=CMD()`). (4) Set `Content-Type: text/csv` explicitly. Implementation must follow these; do not proceed to build until acknowledged.

---

## Stakeholder Routing

- **AEs/SEs to notify on PR:** From Canny/Zendesk attribution — Acme Corp and Stark Industries are Enterprise customers; product server lookup: AE Mike Chen, SE Sarah Lee (e.g. for Acme). Tag these when opening the PR so they can align with customer communication (e.g. Canny update, ticket closure).

---

## AI Attribution

- **AI-analyzed:** Ingest (Gong, Canny, Zendesk), triangulation, prioritization, problem statement, requirements, acceptance criteria, test requirements, technical constraints, UI/frontend scope, architecture gate check, stakeholder routing.
- **Human-reviewed:** TBD (spec approval, security review acknowledgment for Gate 4).
