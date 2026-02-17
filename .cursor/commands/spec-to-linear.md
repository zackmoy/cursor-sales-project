# Create or update Linear ticket from spec

Use the **Linear** MCP to either create a new issue or enrich an existing one from our feature spec. Avoid duplicates; prefer commenting on and assigning existing backlog issues when they match.

---

## 1. Find the spec

Use the spec the user names, or the most recent one in `specs/` (e.g. `specs/csv-bulk-export.md`). Read it and note: **feature name / title**, **origin** (Gong/Canny/Zendesk, signal strength), **problem statement**, **requirements** or **acceptance criteria**, and any **stakeholder / PM** mentioned.

---

## 2. Check for an existing Linear issue (avoid duplicates)

Use the Linear MCP to **search or list issues** (e.g. by title or query) that match this feature. For example search for the feature name or key terms (e.g. "CSV bulk export", "CSV export").

- **If you find a matching issue** (same feature/topic), do **not** create a new one. Go to step 3.
- **If you find no match**, go to step 4 (create new).

---

## 3. Existing issue: add context and optionally assign

If the matching issue is **not** in a terminal state (e.g. it’s in Backlog, Triage, or similar — not In Progress/Done/Canceled):

1. **Add a comment** to the issue with:
   - Spec file path (e.g. `specs/csv-bulk-export.md`)
   - Short **origin** (signal from Gong/Canny/Zendesk, strength)
   - One or two **customer quotes** from the spec
   - That this context was generated from the Signal-to-Code pipeline
2. **Optionally set assignee** to the correct PM if the spec names one (e.g. in “Stakeholder routing” or “Origin”) or the user says who should own it. If you don’t know the PM’s Linear user, add a line in the comment like: *Suggested owner: [name from spec].*

If the issue is **already In Progress or Done**, still add a **comment** with the spec path and origin so the implementer has the full context. Only change assignee/state if the user asks.

Reply with the issue identifier (e.g. SYT-17), link, and that you commented (and assigned if applicable).

---

## 4. No existing issue: create one

If there was no matching issue:

- **Create** a Linear issue with:
  - **Title:** Feature name (e.g. "CSV bulk export for analytics dashboard")
  - **Description:** Origin (signal sources), problem statement, main requirements or acceptance criteria, and the spec file path
  - **Project/team/labels:** Use what the user asked for, or leave default
- Reply with the new issue identifier and link.

---

## 5. If Linear MCP isn’t available

Say: "Linear MCP isn’t connected. Add it in Cursor Settings → MCP and sign in to Linear (see docs/DEMO_SCRIPT.md)."
