# Do a Linear ticket (plan + implement)

The user will provide a **Linear issue**: either the **issue identifier** (e.g. `SYT-17`) or the **full issue URL** (e.g. `https://linear.app/.../issue/SYT-17/...`). They may type it in the same message as this command or in the next message.

---

## 1. Get the issue

- If the user gave an **identifier** (e.g. SYT-17), use the Linear MCP to **get that issue** by id/identifier.
- If they gave a **URL**, parse the issue identifier from the URL (e.g. SYT-17 from `.../issue/SYT-17/...`) and fetch the issue with the Linear MCP.
- If nothing was provided yet, ask: "Which Linear issue? Please paste the issue URL or the issue id (e.g. SYT-17)."

---

## 2. Use the issue as the spec source

- Read the issue **title** and **description** from Linear.
- If the description mentions a **spec file** (e.g. `specs/csv-bulk-export.md` or `specs/foo.md`), open that file in the repo and use it as the main spec (requirements, acceptance criteria, technical constraints).
- If no spec path is mentioned, **infer** a likely spec from the title (e.g. "CSV bulk export for analytics dashboard" → `specs/csv-bulk-export.md`). If that file exists, use it; otherwise use the **issue description** as the spec (extract requirements and acceptance criteria from the body).
- Summarize in one short paragraph: what we're building, and where the spec came from (Linear issue + optional spec file).

---

## 3. Plan the implementation

Following our **architecture** (see `.cursor/rules/architecture.mdc`):

- **List the exact changes** you will make: new or modified files under `src/services/`, `src/api/routes/`, `src/components/`, and `src/__tests__/`. Use our stack: Vite + React frontend, Express API, TypeScript, Zod.
- **Include UI when the feature is user-facing:** If the spec has a "UI / Frontend" section or the feature clearly has a user-facing surface (e.g. export, dashboard, form), the plan MUST include changes to `src/components/` (or new components). Do not deliver API-only when the spec or customer need implies a UI.
- **Map to acceptance criteria** from the spec (or issue) where possible.
- Present this as a **numbered plan** and ask the user to approve before writing code.

---

## 4. Implement after approval

- Implement the plan: add or edit services, routes, components, and tests. Follow existing patterns in the repo (e.g. `AnalyticsService`, `analytics.ts` route, `AnalyticsDashboard.tsx`).
- When done, briefly confirm: what was added/changed, and the Linear issue id (e.g. SYT-17) so the user can move it to In Progress or link a PR.

**Optional:** If the user wants, you can use the Linear MCP to **update the issue** (e.g. set status to "In Progress" when you start, or add a comment with the branch/PR when done). Only do this if the user asks or if the command said to.

---

## 5. If Linear MCP isn’t available

Say: "Linear MCP isn’t connected. Add it in Cursor Settings → MCP and sign in to Linear (see docs/DEMO_SCRIPT.md). I can still implement from a spec: paste the issue description or the path to a spec file (e.g. specs/csv-bulk-export.md) and I’ll plan and build from that."
