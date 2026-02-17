# Signal to PR (full pipeline / yolo)

**One run:** Ingest signal → triangulate → write spec → create/find Linear issue → plan → implement → tests → **open a PR**.

Use the **modular** commands (`/signal-to-spec`, `/spec-to-linear`, `/do-linear-ticket`) when you want to pause at a step. Use **this** when you want the full pipeline and a PR at the end.

---

## 1. Signal → Spec (steps 1–3)

Do the same as **`/signal-to-spec`** (see `.cursor/commands/signal-to-spec.md`), including the **signal window** (default: last two weeks; user can say "last week" or "last month" to override):

- **Ingest:** Pull broadly from Gong (calls in the signal window; use get_call_participants and product lookup_customer for role and customer/prospect/tier), Canny (top requests, voter companies), Zendesk (tickets, companies). Short report with themes and, for key voices, role and customer status.
- **Triangulate:** Cross-source table weighted by role, customer status, and deal potential (see signal-analysis rule); pick strongest feature, cite evidence and why it outweighs others.
- **Write spec:** Create/overwrite `specs/<feature>.md` with origin, problem, requirements, acceptance criteria, technical constraints, UI, test requirements.

Confirm the spec path and top-priority feature name.

---

## 2. Spec → Linear

Do the same as **`/spec-to-linear`** (see `.cursor/commands/spec-to-linear.md`):

- Use the spec you just wrote. Search Linear for an existing issue that matches.
- **If match:** Add a comment with spec path, origin, customer quotes; optionally assign. Add label **`Cursor-sourced`** to the issue if it exists. Use that issue.
- **If no match:** Create a new issue with title, description (origin, problem, requirements, spec path), and label **`Cursor-sourced`**.

**Capture the issue identifier** (e.g. `SYT-17`) for the branch and PR.

---

## 3. Plan

From that Linear issue and the spec file:

- List exact changes: `src/services/`, `src/api/routes/`, `src/components/`, `src/__tests__/`. Map to acceptance criteria. Include UI and tests when the spec requires them (see `.cursor/rules/architecture.mdc`).
- Present a **numbered plan**.

**Approval:**

- If the user said **"yolo"**, **"no approval"**, or **"just do it"** (or equivalent), **proceed to step 4** without waiting.
- Otherwise, **ask for explicit approval** before implementing. Do not create the branch or write code until they approve.

---

## 4. Implement

- **Create branch:** `git checkout main`, `git pull` (if applicable), `git checkout -b feat/<issue-id>` (e.g. `feat/SYT-17`).
- Implement the plan (services, routes, components, tests). Follow existing patterns.
- **Run `npm test`**; fix any failures before continuing.
- **Add the label `Cursor-built`** to the Linear issue (via Linear MCP update_issue) so it's counted as pipeline-built for metrics. If the label doesn't exist, skip.

---

## 5. Open a PR

- **Stage:** `git add -A` (or only the files you changed, as appropriate).
- **Commit:** Message should reference the Linear issue and feature, e.g. `feat(SYT-17): CSV bulk export for analytics dashboard` or `feat: CSV bulk export [SYT-17]`.
- **Push:** `git push -u origin feat/<issue-id>`.
- **Create PR:** `gh pr create --fill` (or `gh pr create -t "<title>" -b "<body>"`). In the PR body, include:
  - **Reference the Linear issue** (e.g. "Closes SYT-17" or "Implements SYT-17 — CSV bulk export") so the PR links to the ticket.
  - **One outcome line** from the spec you wrote (e.g. "Outcome: CSV bulk export for Acme Corp from Gong/Canny/Zendesk."). That makes the PR an outcome-based success artifact for adoption metrics and exec storytelling.

**Requirements:** `gh` must be installed and authenticated (`gh auth status`). If not, tell the user: "Install and log in to the GitHub CLI (`gh`) to open the PR. Your branch is pushed; you can create the PR in the GitHub UI or run `gh pr create --fill` locally."

**Optional:** Use the Linear MCP to add a comment on the issue with the PR URL, or set the issue to In Progress, if the user asked for it.

---

## 6. If something fails mid-run

- **MCPs missing:** If Gong/Canny/Zendesk or Linear aren’t available, say so and stop at the step that needs them; suggest checking Settings → MCP and docs/DEMO_SCRIPT.md.
- **Tests failing:** Do not push or open a PR until tests pass; fix or report what’s broken.
- **No `gh`:** Complete through push, then tell the user to run `gh pr create --fill` or create the PR in the UI.
