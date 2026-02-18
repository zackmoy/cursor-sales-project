# Open a PR from the current branch

Use this after you've implemented a feature (e.g. via `/do-linear-ticket`) and want to stage, commit, push, and open a PR. You should already be on a feature branch with uncommitted changes (or with commits not yet pushed).

---

## 1. Check state

- Confirm the current branch (e.g. `feat/SYT-17`). If the user is on `main` with no branch, say they should create/checkout a feature branch first.
- If the user provided a **Linear issue id** (e.g. SYT-17) in the same or previous message, use it for the commit message and PR body.

---

## 2. Stage and commit

- **Stage:** `git add -A` (or the files that are part of this feature).
- **Commit message:** If the user gave a message, use it. Otherwise infer from the branch name or Linear issue (e.g. `feat(SYT-17): CSV bulk export for analytics dashboard` or `feat: CSV bulk export [SYT-17]`).
- Run `git commit` with that message. If there’s nothing to commit, say so and stop.

---

## 3. Push and create PR

- **Push:** `git push -u origin <current-branch>`.
- **PR body:** Build the body so reviewers get context and a clear QA path. When a spec exists in `specs/` for this feature (e.g. `specs/csv-bulk-export.md`), use it to fill the summary and QA checklist (problem statement, requirements, acceptance criteria). **Do not create or commit a PR body file in the repo.** Generate the body content (e.g. in a heredoc or as a string) and pipe it to `gh pr create` so the body is sent directly: e.g. `gh pr create --title "..." --body-file -` with the body fed on stdin (e.g. `printf '%s' "$BODY" | gh pr create --title "..." --body-file -` or a heredoc). If piping is awkward in the environment, use `gh pr create` and then `gh pr edit <number> --body "..."` or instruct the user to paste the sections below into the GitHub PR description. Include:

  **Summary / implementation**
  - **Outcome line** (when you have context from spec or issue): e.g. `Outcome: [feature] for [customer/source] from Gong/Canny/Zendesk.`
  - **Linear:** `Closes SYT-17` (or `Implements SYT-17`) if the user gave an issue id or it’s in the branch name.
  - **What changed:** 1–3 sentences on the problem and what was built (from the spec’s problem statement and requirements if available).
  - **Implementation notes:** Short list of key additions/changes — e.g. new route (`POST /api/export`), new service (`export-service.ts`), dashboard button and handler, tests added. Reference file paths so reviewers know where to look.

  **Testing / QA checklist**
  - Add a **Testing** or **QA checklist** section so reviewers and QA know how to verify the feature. Include:
    - [ ] **Automated:** `npm test` passes (unit + integration for new code).
    - [ ] **API** (if applicable): How to hit the new endpoint(s) — method, path, example body/params; expected response or behavior.
    - [ ] **UI** (if applicable): Short manual steps — e.g. open dashboard, set date range, click Export CSV, confirm file downloads and contents.
    - [ ] **Acceptance criteria:** 1–3 bullets mapping to the spec’s AC (e.g. “CSV contains selected metrics and date range”, “Button disabled while export in progress”). Pull from the spec when possible.
  - If the spec has specific test requirements or edge cases (e.g. tier limits, error handling), add a checkbox or note for those.

**If `gh` isn’t installed or authenticated:** Tell the user to run `gh pr create --fill` locally or create the PR in the GitHub UI; give them the branch name and the suggested body sections above so they can paste into the description.

---

## 4. Confirm

Reply with the PR URL (from `gh` output) and the branch name. Optionally remind them to link the PR in Linear or move the issue to In Progress.
