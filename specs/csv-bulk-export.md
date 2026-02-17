# CSV Bulk Export from Analytics Dashboard

## Origin
- **Signal Strength:** Critical
- **Gong:**
  - "Acme Corp - Q1 Analytics Review" (Jane Smith, VP Engineering): Blocking Q1 board prep; risk of churn to Datadog; +30 seats expansion opportunity.
  - "Stark Industries - Dashboard Review & Roadmap" (Anna Reyes, Director of Data): "Export first, no question." Data team wasting hours manually copying data.
- **Canny:** Top-voted request (47 votes) "Bulk CSV export from analytics dashboard" (Jane Smith).
- **Zendesk:** 4 recent tickets from Acme and Stark explicitly requesting CSV export for board reporting.

## Problem Statement
Enterprise customers (Acme, Stark) need to extract analytics data for external reporting (e.g., board decks, quarterly reviews). Currently, they are forced to take screenshots or manually copy numbers into spreadsheets, which is error-prone and unscalable for their volume (150-500 seats).

## Customer Quotes
> "Every quarter, I need to pull data for our board deck. Right now, my analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It's embarrassing." — Jane Smith, VP Engineering @ Acme Corp

> "We need CSV export badly. Our data team runs quarterly reviews and right now they're screen-scraping the dashboard." — Anna Reyes, Director of Data @ Stark Industries

> "Specifically, we need to be able to export filtered data — not just the full dump, but what's on screen after we apply date range and metric filters." — James Obi, Sr Analyst @ Stark Industries

## Requirements
- **Date Range Selection:** Users must be able to define a start and end date for the export (defaulting to the current dashboard view).
- **Metric Selection:** Users can choose which metrics to include as columns in the CSV.
- **Filter Respect:** The export must respect currently active dashboard filters (e.g., by team, region, or other dimensions).
- **CSV Format:** The output must be a valid CSV file with headers matching the dashboard metric names.
- **UI Access:** A prominent "Export" button on the main analytics dashboard.

## Acceptance Criteria
- [ ] User can click "Export" on the analytics dashboard.
- [ ] User can select a custom date range (or use the current dashboard range).
- [ ] User can select specific metrics to include (or "Select All").
- [ ] Clicking "Download CSV" triggers a browser download of a `.csv` file.
- [ ] The CSV file contains a header row with metric names.
- [ ] The CSV file contains data rows corresponding to the selected date granularity (e.g., daily/weekly).
- [ ] Data in the CSV matches the values shown in the dashboard for the same period/filters.
- [ ] Export is scoped strictly to the user's `workspaceId`.

## Technical Constraints
### Backend
- **Service:** Update `AnalyticsService` (likely in `src/services/analytics.ts` or similar) to support data retrieval for export.
- **Format:** Use a standard CSV generation library (e.g., `csv-stringify`) to ensure proper escaping of special characters.
- **Performance:** Ensure the export query is optimized and doesn't time out for large date ranges (Acme/Stark have large datasets). Stream the response if necessary.

### API
- **Endpoint:** `POST /api/analytics/export`
- **Body:**
  ```json
  {
    "startDate": "ISO-8601",
    "endDate": "ISO-8601",
    "metrics": ["metric_id_1", "metric_id_2"],
    "filters": { ... }
  }
  ```
- **Response:** `200 OK` with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="analytics-export-YYYY-MM-DD.csv"`.

### Frontend
- **Component:** Add `ExportButton` component to the dashboard header.
- **Interaction:** Opens a modal/popover for configuration (dates, metrics) before triggering the download.

## Architecture Review
- [ ] `NEEDS_SECURITY_REVIEW`: Export filename uses user-supplied dates/inputs in Content-Disposition header. Must sanitize to prevent header injection.
- [ ] `NEEDS_DESIGN_REVIEW`: N/A — No new persistence layer (stateless export).
- [ ] `NEEDS_BREAKING_CHANGE_REVIEW`: N/A — New endpoint, no changes to existing APIs.

## Test Requirements
- **Unit Tests:**
  - `AnalyticsService.exportToCsv`: Verify it correctly formats data, handles empty states, and escapes characters.
  - Test that it correctly applies date ranges and filters to the underlying query.
- **Integration Tests:**
  - `POST /api/analytics/export`: Verify it returns 200 OK, correct Content-Type, and a valid CSV body.
  - Verify it returns 403/401 if unauthorized or accessing wrong workspace data.
