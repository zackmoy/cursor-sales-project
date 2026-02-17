# Review the current PR / staged changes

Use this to run an architecture, security, and quality review on the current branch's changes — the same checks that would catch issues before a PR is merged.

---

## 1. Gather the diff

- Run `git diff main...HEAD` (or `git diff --staged` if there's no branch divergence yet) to get the full set of changes.
- List the files changed and categorize them: **services**, **routes**, **components**, **tests**, **specs**, **rules**, **config/other**.

---

## 2. Architecture review (from `architecture-check` rule)

For each changed or new file, check:

- **Gate 1 — New Persistence Layer:** Do any changes introduce state that survives the session (localStorage, database, saved preferences)? If yes → flag `NEEDS_DESIGN_REVIEW` and explain.
- **Gate 2 — New Auth / Access Control:** Do changes add user-specific scoping, new RBAC, or new token handling? If yes → flag `NEEDS_SECURITY_REVIEW` and explain.
- **Gate 3 — Shared Interface Change:** Do changes modify the props/interface of a shared component, alter an API route's request/response shape, or rename/remove a public export? If yes → flag `NEEDS_BREAKING_CHANGE_REVIEW` and explain.

---

## 3. Security review (from `architecture-check` Gate 4 + OWASP)

For each route or service that handles user input:

- **Input validation:** Is every user-provided field validated (Zod schema, type checks)? Are there fields that pass through unvalidated?
- **Injection risk (Gate 4):** Could any user input end up in filenames, HTTP headers, SQL, shell commands, or HTML without sanitization? Check `Content-Disposition` headers, CSV column names, error messages. Flag if user input flows to output unsanitized.
- **CSV injection:** Do CSV headers or values come from user input? Crafted values like `=CMD()` can execute in spreadsheet apps. Metric names must be checked against an allowlist.
- **Sensitive data:** Are error messages leaking stack traces, internal paths, or config? Are secrets or tokens logged?
- **Export / download endpoints:** Does the response filename use user input? Is it sanitized (regex: allow only `[a-zA-Z0-9._-]`)? Is content-type set explicitly?

---

## 4. Quality and consistency review

- **Test coverage:** Do the changed services and routes have corresponding tests in `src/__tests__/`? Do the tests cover the acceptance criteria from the relevant spec (if one exists in `specs/`)?
- **Error handling:** Do new routes have try/catch? Are errors returned as structured JSON (not raw stack traces)?
- **Domain language:** Check against the architecture rule — use "workspace" not "organization", "analytics" not "metrics", "export" not "download", "member" not "user".
- **Naming conventions:** camelCase for functions/variables, PascalCase for components/types, kebab-case for filenames.

---

## 5. Output

Produce a structured review with sections:

```
## PR Review: [branch name or feature]

### Files Changed
- (categorized list)

### Architecture Checks
- Gate 1 (Persistence): ✅ PASS / ⚠️ FLAG — [reason]
- Gate 2 (Auth): ✅ PASS / ⚠️ FLAG — [reason]
- Gate 3 (Interface): ✅ PASS / ⚠️ FLAG — [reason]

### Security Checks
- Input validation: ✅ / ⚠️ [details]
- Injection risk: ✅ / ⚠️ [details]
- Sensitive data: ✅ / ⚠️ [details]
- Export/download safety: ✅ / ⚠️ [details]

### Quality & Consistency
- Test coverage: ✅ / ⚠️ [details]
- Error handling: ✅ / ⚠️ [details]
- Domain language: ✅ / ⚠️ [details]
- Naming: ✅ / ⚠️ [details]

### Summary
[1-2 sentence overall assessment: ship it, ship with notes, or block and fix]
```

If any check is flagged, explain what needs to change and where. Be specific — reference file paths and line numbers.
