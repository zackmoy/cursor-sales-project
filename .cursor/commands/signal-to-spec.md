# Signal to spec (steps 1–3)

Do the following in order. Use our rules (signal-analysis, spec-template) when they apply.

---

## Signal window (configurable)

**Default:** Last **two weeks**. Use this unless the user asks for a different window.

**How to configure:** Include the time range in the same message as the command. Examples: `/signal-to-spec`, `/signal-to-spec last month`, `/signal-to-spec find the most important issues in the last week`. No separate config file — the user's words override the default.

**Override:** If the user specifies a time range (e.g. "last week", "last month", "last quarter"), use that for Gong and any source that supports date filtering. Rationale:
- **Last week** — Suits fast-moving teams (e.g. startups) that get feedback constantly and want to react to what's hot right now.
- **Last month** — Suits larger orgs that run monthly review cycles or need more volume before prioritizing.
- **Last two weeks** (default) — Balanced: enough signal to triangulate, recent enough to be actionable.

When calling Gong's `search_calls`, pass `fromDate` and `toDate` in ISO format based on the chosen window. Canny and Zendesk don't filter by date in this setup; their results are recency-ordered or vote-ordered as the API provides.

---

## Step 1 — Ingest

Pull customer signal from **all three sources** within the **signal window** (see above). Cast a wide net — don't filter to a specific topic yet; the triangulation step will identify the strongest theme.

1. **Gong:** Search for calls in the signal window (default: last two weeks). Get the transcript for the 2–3 most relevant calls that mention product feedback, pain points, or feature requests. Summarize what you found (participants, key quotes, topics raised).
2. **Canny:** List feature requests sorted by vote count. Note the top requests, their scores, voter companies, and any themes that emerge.
3. **Zendesk:** Search for recent open or pending tickets. Note recurring themes, which companies are filing them, and any patterns (e.g. multiple tickets about the same pain).

Give a short report: what each source returned and the **main themes** you see emerging across them.

---

## Step 2 — Triangulate

Using that signal across Gong, Canny, and Zendesk:

- Build a **cross-source table**: feature/theme name | Gong mentions | Canny votes | Zendesk tickets | Strength (Critical / High / Medium).
- Pick the **strongest** feature (the one with the most evidence across sources).
- In 2–3 sentences, explain why it's top priority and cite evidence from each source (exact quotes or numbers).

---

## Step 3 — Write the spec

For that top-priority feature:

- **Create or overwrite** a spec file in `specs/` with a kebab-case name (e.g. `specs/csv-bulk-export.md`).
- Include:
  - **Origin:** Which Gong call(s), Canny request(s), and Zendesk ticket(s) drove this; signal strength.
  - **Problem statement** (1–2 sentences).
  - **Customer quotes** (exact words from transcripts or tickets).
  - **Requirements** (3–5 bullets); for user-facing features, include both API and UI (e.g. export endpoint + "Export CSV" in the dashboard).
  - **Acceptance criteria** (checkboxes, testable); include at least one criterion for the UI when the feature is user-facing.
  - **Technical constraints:** Backend (e.g. `AnalyticsService`, `src/api/routes/analytics.ts`) and, when applicable, frontend (e.g. `src/components/`).
  - **UI / Frontend:** Which components or pages are new or updated, and what the user can do (or "N/A — API-only" if no user-facing surface).
  - **Test Requirements:** Which tests are required (unit for new logic/services, integration for new routes) and how they map to acceptance criteria (e.g. "AC: export returns CSV" → unit test for CSV builder + integration test for POST /api/export).

Run all three steps in this conversation. When done, confirm the spec file path and the top-priority feature name.
