# Bulk CSV Export from Analytics Dashboard

## Origin (Multi-Source Attribution)

- **Gong:** Call 7782822860530291749 (Acme Corp – Q1 Analytics Review, 2026-02-10): Jane Smith, VP Engineering, Acme — CSV for board deck, deal-blocking language. Call 7782822860530291751 (Stark Industries – Dashboard Review, 2026-02-13): Anna Reyes, Director of Data, and James Obi, Senior Analyst — “export first”; need filtered export (date range + metrics). Call 7782822860530291752 (Beta Inc – Renewal Check-in, 2026-02-14): Carlos Vega, Engineering Manager — CSV for investors; renewal contingent on export. **Signal strength: Critical.**
- **Canny:** Request 553c3ef8b8cdcd1501ba4001 “Bulk CSV export from analytics dashboard” — score 47, status under review, ETA March 2026. Voter companies: Acme Corp, Stark Industries, Beta Inc, Wayne Enterprises, Umbrella Corp, Cyberdyne, Initech. **Signal strength: Critical.**
- **Zendesk:** Tickets 35001 (export monthly analytics as CSV, high, open), 35003 (CSV export for Q1 board deck — urgent, high, open), 35004 (bulk download), 35006 (export + Canny vote). Requester org 509974 (Acme) on multiple. **Signal strength: Critical.**

**Customer vs prospect:** Acme (Enterprise, 150 seats), Stark (Enterprise, 500 seats), and Beta (Starter, 5 seats, renewal April 2026) are existing customers. Evidence weighted by role (VP, Director, Manager) and renewal/expansion context.

---

## Problem Statement

Customers need to get analytics data out of the dashboard as CSV for board reporting, quarterly reviews, and external analysis. Today they have no supported way to do this; teams are screenshotting, copy-pasting, or screen-scraping, which is error-prone and blocks board decks and renewals.

---

## Customer Quotes

- **Jane Smith (VP Engineering, Acme):** “Every quarter, I need to pull data for our board deck. Right now, my analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It’s embarrassing.” “CSV would be perfect. We just need to be able to select a date range, pick which metrics we want, and export.” “If we can’t export by then, I’ll have to escalate to my CTO and we might need to evaluate alternatives.”
- **Anna Reyes (Director of Data, Stark):** “We have the same problem Jane at Acme mentioned to you — we need CSV export badly. Our data team runs quarterly reviews and right now they’re screen-scraping the dashboard.” “Export first, no question. We can’t live without being able to get data out for our board.”
- **James Obi (Senior Analyst, Stark):** “Specifically, we need to be able to export filtered data — not just the full dump, but what’s on screen after we apply date range and metric filters. And the column headers need to match what the dashboard shows.”
- **Carlos Vega (Engineering Manager, Beta):** “Is there any way to get data out? Even a simple CSV export would help. We sometimes need to pull numbers for our investors.” “If customization and export land, we’d definitely renew. Without them, we’ll probably downgrade or look elsewhere.”
- **Zendesk 35003:** “Same request as our Canny vote — CSV export from analytics dashboard is blocking our Q1 board review.”
- **Zendesk 35001:** “We need to export analytics data as CSV for our board reporting workflow. Currently we have no way to get data out of the dashboard programmatically.”

---

## Requirements

1. **Backend:** Add an export API (e.g. `POST /api/export` or `POST /api/analytics/export`) that accepts `workspaceId`, date range (`from`, `to`), and list of metric identifiers; returns CSV with headers matching the dashboard and rows for the selected metrics over the date range. Reuse `AnalyticsService` (or equivalent) for data; no new persistence.
2. **Backend:** Validate and sanitize inputs: date range as ISO dates, metric names against an allowlist derived from supported analytics metrics. Reject invalid or disallowed values with 400 and clear error messages.
3. **Backend:** Set response `Content-Type: text/csv` and `Content-Disposition: attachment; filename="..."`. Filename must be derived from sanitized values only (e.g. workspace id, validated date range) — no unsanitized user input in filename or headers (see Architecture Review).
4. **Frontend:** Add an “Export CSV” (or equivalent) control to the analytics dashboard that triggers export using the current dashboard date range and selected metrics. Control is visible when the user is viewing analytics (same context as the existing dashboard); enablement: enabled when date range and at least one metric are selected (or when current query context is valid).
5. **Frontend:** After the user triggers export, the browser downloads the CSV file (same-origin request or blob download). Show a brief loading state while the request is in progress; on error, show a clear message (e.g. “Export failed: …”).

---

## Acceptance Criteria

- [ ] **AC1:** Valid request to the export endpoint with `workspaceId`, valid ISO date range, and allowlisted metrics returns HTTP 200 with `Content-Type: text/csv` and a CSV body whose first row is headers and subsequent rows are data for the selected metrics over the date range.
- [ ] **AC2:** Export endpoint rejects requests with invalid date range (e.g. non-ISO, end before start) or non-allowlisted metric with HTTP 400 and a clear error payload.
- [ ] **AC3:** The `Content-Disposition` header uses a filename that contains only sanitized values (e.g. alphanumeric, hyphen, underscore); no user-supplied free text in filename.
- [ ] **AC4:** Dashboard shows an “Export CSV” control when the user is on the analytics view; the control is enabled when the current date range and metric selection are valid for export.
- [ ] **AC5:** Clicking “Export CSV” with valid context triggers a request to the export API and results in a CSV file download; column headers in the CSV match what the dashboard shows for the selected metrics.
- [ ] **AC6:** If the export request fails, the user sees an error message (e.g. toast or inline) and no file is downloaded.

---

## Test Requirements

- **Unit:** Export service or CSV builder (if extracted): given valid query params, produces CSV with correct headers and rows; given invalid dates or disallowed metric, throws or returns error. Maps to AC1, AC2.
- **Unit:** Filename/sanitization helper: only allowed characters in output; no path traversal. Maps to AC3.
- **Integration:** Export route: POST with valid body → 200, CSV, correct Content-Type and Content-Disposition; invalid body → 400. Maps to AC1, AC2, AC3.
- **Component (or integration):** Dashboard: “Export CSV” visible and enabled when context is valid; click triggers request and download (or blob); error response shows message. Maps to AC4, AC5, AC6.

---

## Technical Constraints

- **Backend:** Use existing `AnalyticsService` (or equivalent) in `src/services/` for querying analytics data; add export route under `src/api/routes/` (e.g. `export.ts` or extend `analytics.ts`). No new persistence layer; export is request-scoped.
- **Validation:** Use Zod (or existing validation) for request body; validate dates as ISO; restrict metric names to an allowlist derived from `AnalyticsService` / product metrics.
- **Performance:** For very large result sets, consider streaming or row limits per existing analytics constraints (e.g. `maxExportRows` in product config if present). Spec does not require streaming in v1 if current analytics API is bounded.

---

## UI / Frontend

- **Components/pages:** Update or extend the analytics dashboard in `src/components/` (e.g. `AnalyticsDashboard.tsx`) to add the export control (button or similar).
- **User action:** User selects date range and metrics (existing behavior); user clicks “Export CSV”; browser downloads the CSV file.
- **Visibility:** “Export CSV” is visible whenever the user is on the analytics dashboard view (same place where date range and metrics are shown).
- **Enablement:** “Export CSV” is enabled when the current date range is valid (e.g. from ≤ to, within allowed range) and at least one metric is selected (or current query context is valid for export). Disabled otherwise.
- **Loading/error:** While the export request is in progress, show loading state (e.g. disabled button + spinner or toast “Exporting…”). On success, trigger download. On error, show message and do not download.

---

## Architecture Review

- [ ] **`NEEDS_SECURITY_REVIEW`:** Export uses user-supplied date range and metric names in the request. Filename in `Content-Disposition` must be built from validated/sanitized values only (e.g. strip or reject characters outside `[a-zA-Z0-9._-]`; validate dates as ISO). Metric names must be checked against an allowlist before inclusion in CSV headers to prevent CSV injection (e.g. `=CMD()`). Mitigation: (a) server-generated filename from workspace id + validated date range only; (b) allowlist of metric IDs for headers; (c) explicit `Content-Type: text/csv`. Proceed only after developer acknowledges and agrees to implement this mitigation.

---

## Stakeholder Routing

- **AEs/SEs to notify on PR:** Mike Chen (AE – Acme, Stark), Sarah Lee (SE – Acme, Stark). Beta Inc renewal owner per product server (if assigned) to be notified for positioning.

---

## AI Attribution

- Signal ingestion, triangulation, and prioritization: AI (Gong, Canny, Zendesk, product-server lookups).
- Spec structure and requirements: AI, following `.cursor/rules/spec-template.mdc` and `.cursor/rules/signal-analysis.mdc`.
- Customer quotes: verbatim from Gong transcripts and Zendesk ticket text.
- Architecture Review (Gate 4): AI, per `.cursor/rules/architecture-check.mdc`. Human review required before implementation.
