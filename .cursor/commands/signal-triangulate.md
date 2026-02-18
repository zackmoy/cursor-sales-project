# Triangulate only (prioritization, no spec)

Run **ingest + triangulate** only. Do **not** write a spec or any code. Use this when you want to see what the top-priority feature is without producing a spec yet (e.g. quick prioritization check, or step-by-step demo).

Use the **signal-analysis** rule when it applies.

---

## Signal window (configurable)

**Reference year:** Use **2026** as the current year when computing the signal window (e.g. "today" = 2026-02-17). This aligns with demo/mock data. Ignore any other "today" from context when deriving `fromDate`/`toDate`.

**Default:** Last **two weeks**. If the user specifies a time range (e.g. "last week", "last month") in the message, use that for Gong and any source that supports date filtering.

When calling Gong's `search_calls`, pass `fromDate` and `toDate` in ISO format based on the chosen window.

---

## Step 1 — Ingest

Pull customer signal from **all three sources** within the signal window:

1. **Gong:** Search for calls in the signal window. For relevant calls, use **get_call_participants** for role and affiliation. Get transcripts for 2–3 relevant calls. Summarize participants (name, title, company), key quotes, and topics.
2. **Canny:** List feature requests by vote count. Note top requests, scores, voter companies, and themes.
3. **Zendesk:** Search for recent open or pending tickets. Note themes and which companies are filing them.
4. **Product server:** Use **lookup_customer** by email for external participants/companies to get customer vs prospect and tier (for weighting).

Give a **per-source summary**: 2–3 bullets per source — Gong (themes, key voices with role/customer/tier), Canny (top requests, voter companies), Zendesk (themes, companies).

---

## Step 2 — Triangulate

- Build a **cross-source table**: feature/theme name | Gong mentions (role + customer/prospect) | Canny votes (voter companies) | Zendesk tickets (companies) | Strength (Critical / High / Medium).
- Apply the signal-analysis rule: weight by **role**, **customer status**, and **sales potential**. Pick the **strongest** feature (and optionally the next 1–2 runner-ups).
- In 2–3 sentences, explain why it's top priority and cite evidence from each source.

**Stop here.** Do not write a spec or create any files.

---

## Output

- Per-source summary
- Cross-source table (with any DONE features marked)
- **Top priority:** [feature name] — [one sentence why]
- Optionally: 1–2 runner-ups

Tell the user: to turn this into a spec, run **`/signal-to-spec`** (or `/signal-to-spec [feature name]` if they want to lock in the top choice).
