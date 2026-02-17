# Signal to spec (steps 1–3)

Do the following in order. Use our rules (signal-analysis, spec-template) when they apply.

---

## Step 1 — Ingest

Pull recent customer signal about **analytics and export** from all three sources:

1. **Gong:** Search for calls that mention analytics or export, then get the transcript for the most relevant call. Summarize what you found (participants, key quotes, pain points).
2. **Canny:** Search for feature requests about export or CSV. Note vote counts, status, and voter companies.
3. **Zendesk:** Search for tickets tagged export or csv. Note how many and which companies.

Give a short report: what each source returned and the main themes.

---

## Step 2 — Triangulate

Using that signal across Gong, Canny, and Zendesk:

- Build a **cross-source table**: feature name | Gong mentions | Canny votes | Zendesk tickets | Strength (Critical / High / Medium).
- Pick the **strongest** feature (the one with the most evidence across sources).
- In 2–3 sentences, explain why it’s top priority and cite evidence from each source (exact quotes or numbers).

---

## Step 3 — Write the spec

For that top-priority feature (e.g. CSV bulk export):

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
