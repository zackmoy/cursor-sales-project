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
- **PR:** `gh pr create --fill`. In the PR body, include:
  - **Reference the Linear issue** (e.g. `Closes SYT-17` or `Implements SYT-17`) if the user gave an issue id or it’s in the branch name.
  - **One outcome line** when you have context (e.g. from the spec or issue): e.g. `Outcome: [feature] for [customer/source] from Gong/Canny/Zendesk.` That makes the PR an outcome-based success artifact, not just a code change (useful for adoption metrics and exec storytelling).

**If `gh` isn’t installed or authenticated:** Tell the user to run `gh pr create --fill` locally or create the PR in the GitHub UI; confirm the branch is pushed and give the branch name.

---

## 4. Confirm

Reply with the PR URL (from `gh` output) and the branch name. Optionally remind them to link the PR in Linear or move the issue to In Progress.
