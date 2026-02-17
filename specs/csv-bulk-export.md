# CSV Bulk Export from Analytics Dashboard

## Origin

| Source | Reference | Signal |
|---|---|---|
| Gong | [Acme Corp - Q1 Analytics Review](https://app.gong.io/call?id=7782822860530291749) (Feb 10 2026) | Jane Smith (VP Eng) — churn risk, 30-seat expansion blocked |
| Gong | [Stark Industries - Dashboard Review](https://app.gong.io/call?id=7782822860530291751) (Feb 13 2026) | Anna Reyes (Dir. of Data), James Obi — export is #1 priority over customization |
| Gong | [Beta Inc - Renewal Check-in](https://app.gong.io/call?id=7782822860530291752) (Feb 14 2026) | Carlos Vega (Eng Mgr) — renewal at risk without export |
| Canny | [Bulk CSV export from analytics dashboard](https://acme-analytics.canny.io/admin/board/feature-requests/p/bulk-csv-export-from-analytics-dashboard) | 47 votes, 7 companies, ~$72.5K MRR at risk |
| Zendesk | #35001, #35003 (high-priority, open) | Acme Corp — "CSV export is blocking our Q1 board review" |
| Zendesk | #35002, #35004, #35006 | 3 additional tickets from other orgs asking for export |

**Signal strength: Critical** — corroborated across all three sources; tied to churn, expansion, and active board-reporting deadlines.

## Problem Statement

Customers have no way to export analytics data from the dashboard. Enterprise teams are reduced to screenshotting charts and copy-pasting numbers from browser dev tools for board decks and stakeholder reporting, which is error-prone, time-consuming, and driving evaluation of competing products.

## Customer Quotes

> "Every quarter, I need to pull data for our board deck. Right now, my analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It's embarrassing."
> — **Jane Smith, VP of Engineering, Acme Corp** (Gong, Feb 10 2026)

> "CSV would be perfect. We just need to be able to select a date range, pick which metrics we want, and export. Datadog lets us do this and we're getting pressure to switch."
> — **Jane Smith, VP of Engineering, Acme Corp** (Gong, Feb 10 2026)

> "Export first, no question. We can live with the default dashboard layout. We can't live without being able to get data out for our board."
> — **Anna Reyes, Director of Data, Stark Industries** (Gong, Feb 13 2026)

> "We need to be able to export filtered data — not just the full dump, but what's on screen after we apply date range and metric filters. And the column headers need to match what the dashboard shows."
> — **James Obi, Senior Analyst, Stark Industries** (Gong, Feb 13 2026)

> "CSV export from analytics dashboard is blocking our Q1 board review."
> — **Acme Corp** (Zendesk #35003)

## Requirements

1. **Export API endpoint** (`POST /api/export`): accepts a date range, list of metrics, and workspace ID; returns a CSV file as a download.
2. **Metric filtering**: the exported CSV contains only the metrics the user selected — matching the dashboard's current filter state.
3. **CSV format**: first row is headers (`date` + selected metric names matching dashboard labels); subsequent rows are one per day in the date range, with values matching the analytics query output.
4. **Frontend "Export CSV" button**: already exists in `AnalyticsDashboard.tsx` — triggers a download of the CSV for the currently selected date range and metrics. Verify it works end-to-end once the backend is in place.
5. **Input sanitization**: date strings validated as ISO dates; metric names checked against an allowlist; filename sanitized (no path traversal or header injection).

## Acceptance Criteria

- [ ] `POST /api/export` with valid `startDate`, `endDate`, `metrics[]`, and `workspaceId` returns HTTP 200 with `Content-Type: text/csv` and a `Content-Disposition` header with a sanitized filename.
- [ ] The CSV body has a header row (`date,<metric1>,<metric2>,...`) followed by one row per day, values matching `AnalyticsService.query()` output for the same inputs.
- [ ] `POST /api/export` with missing or invalid fields returns HTTP 400 with a JSON error body.
- [ ] Metric names not in the allowlist are rejected with HTTP 400.
- [ ] Date values in the filename are validated ISO-8601 strings; characters outside `[a-zA-Z0-9._-]` are stripped.
- [ ] The "Export CSV" button in the dashboard triggers a file download in the browser with the correct CSV content for the selected date range and metrics.
- [ ] Export works correctly for date ranges of 1 day, 30 days, and 90+ days.

## Architecture Review

- [ ] `NEEDS_SECURITY_REVIEW`: Export filename includes user-supplied date strings in the `Content-Disposition` header — must sanitize to prevent header injection. Metric names appear as CSV column headers — must validate against an allowlist to prevent CSV injection (e.g. `=CMD()` in crafted metric names). **Proposed mitigation:** validate dates as ISO-8601 via Zod, strip non-alphanumeric/dot/dash characters from filename, and check metrics against a hardcoded allowlist before building CSV.

## Technical Constraints

### Backend

- **Service**: `AnalyticsService` (`src/services/analytics-service.ts`) — already implements `query()` returning `{ data, labels, totalRows }`. The export endpoint reuses this service; no new persistence or state needed.
- **Route**: new route in `src/api/routes/` (e.g. `src/api/routes/export.ts`), mounted alongside the existing analytics routes.
- **Validation**: Zod schema for the export request body (same shape as analytics query). Metrics validated against an allowlist of known metric keys.
- **CSV generation**: pure function that takes an `AnalyticsResult` and metric labels and returns a CSV string. No external CSV library needed for this scope.
- **Response headers**: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="<sanitized>.csv"`.

### Frontend

- **Component**: `src/components/AnalyticsDashboard.tsx` — the "Export CSV" button and `handleExport()` already exist (lines 174-202) and call `POST /api/export`. Once the backend endpoint is live, verify the end-to-end flow works. Minor adjustments may be needed (e.g. error display, loading state).

## UI / Frontend

- **Existing**: "Export CSV" button in the dashboard header (right side, next to "Run Query").
- **Behavior**: clicking the button sends the current date range and selected metrics to `POST /api/export`, receives a CSV blob, and triggers a browser file download named `analytics-export-<start>-to-<end>.csv`.
- **Edge cases**: button is disabled while export is in progress; errors are displayed in the existing error banner.
- No new components or pages are required.

## Test Requirements

| Test Type | What to Cover | Maps to AC |
|---|---|---|
| **Unit** | CSV builder function — correct headers, row-per-day output, value accuracy, empty-metric edge case | AC: CSV body has header row + one row per day |
| **Unit** | Filename sanitizer — strips unsafe characters, handles edge cases | AC: characters outside allowlist stripped |
| **Unit** | Metric allowlist validation — rejects unknown metrics, accepts known ones | AC: unknown metrics → 400 |
| **Integration** | `POST /api/export` with valid body → 200, correct `Content-Type`, correct CSV content | AC: valid request → 200 + CSV |
| **Integration** | `POST /api/export` with invalid/missing fields → 400 + JSON error | AC: invalid request → 400 |
| **Integration** | `POST /api/export` with 1-day and 90-day ranges → correct row counts | AC: works for 1, 30, 90+ days |

Test files: `src/__tests__/export-service.test.ts` (unit), `src/__tests__/export-route.test.ts` (integration).

## Out of Scope

- Scheduled / automated exports (separate Canny request, 18 votes — future iteration).
- Dashboard customization / saved views (mentioned by Stark and Beta, but explicitly lower priority than export).
- PDF or Excel export formats.
- Per-user export scoping (current architecture scopes by `workspaceId` only).

## Sales Context

- **AE**: Mike Chen (Acme Corp, Stark Industries), Lisa Park (Beta Inc)
- **SE**: Sarah Lee (Acme Corp call)
- **Expansion**: Acme Corp — 30 additional seats contingent on export shipping before Q1 board meeting (~6 weeks from Feb 10).
- **Renewal risk**: Beta Inc renewal in April; export is a deciding factor.
