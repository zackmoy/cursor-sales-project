# cursor-sales-project

<!-- Test commit for open-pr command flow -->

This repo is set up for **agentic development** with Cursor: the AI agent gets consistent context and behavior so changes are predictable and reviewable. It also contains the **Signal-to-Code demo**: a minimal mock product (Vite + React UI, Express API) that the agent extends (e.g. CSV export) from customer signal.

## Demo app (Signal-to-Code)

The mock product the agent will add features to is:

- **Frontend:** Vite + React (fast HMR) in `src/` — `main.tsx`, `App.tsx`, `components/AnalyticsDashboard.tsx`.
- **Backend:** Express API in `src/server.ts` and `src/api/routes/analytics.ts`, using `src/services/analytics-service.ts`.

### Run the demo

```bash
npm install

# Terminal 1: API server (port 3000)
npm run server

# Terminal 2: Vite dev server (port 5173; proxies /api to 3000)
npm run dev
```

Or run both with `npm run dev:all`. Open http://localhost:5173 — the dashboard calls `POST /api/query` to fetch analytics. The agent will add CSV export (and related API routes) to this codebase.

### Mock MCP servers (Signal-to-Code pipeline)

Four mock MCP servers feed **customer signal** into Cursor so the agent can triangulate and build from it:

| Server | Role | Tools |
|--------|------|--------|
| **gong-mock** | Call transcripts | `search_calls`, `get_transcript`, `get_call_participants` |
| **canny-mock** | Feature requests / votes | `search_feature_requests`, `get_request_details`, `get_request_voters` |
| **zendesk-mock** | Support tickets | `search_tickets`, `get_ticket_details`, `get_ticket_comments` |
| **product-server-mock** | Customer lookup / verification | `lookup_customer`, `verify_feature_compatibility` |
| **linear** | Create/issues in Linear (remote, OAuth) | Create/update issues, list projects — see [Linear MCP docs](https://linear.app/docs/mcp) |

**One-time setup:** Install dependencies for each MCP server (Cursor runs them via `.cursor/mcp.json`):

```bash
for d in mcp-servers/*/; do (cd "$d" && npm install); done
```

Restart Cursor (or reload the window) with this project open. In **Cursor Settings → MCP** you should see all four servers with a green status. If the agent says “MCP tools were not available,” see **Troubleshooting** in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

**Running the full demo (signal → spec → code):**

- **One command for steps 1–3:** In Agent chat, type **`/signal-to-spec`**. The agent will ingest from Gong/Canny/Zendesk, triangulate, and write a feature spec to `specs/`. Defined in `.cursor/commands/signal-to-spec.md`.
- **Full walkthrough:** See **[docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)** for step-by-step prompts (including build, verify, and PR) and optional manual prompts for each step.
- **Linear ticket from spec:** Run **`/spec-to-linear`** to create a Linear issue from a spec — or, if one already exists, add a comment with context and optionally assign the PM (see [docs/DESIGN_NOTES.md](docs/DESIGN_NOTES.md)). Requires [Linear MCP](https://linear.app/docs/mcp) added and signed in once.
- **Do a Linear ticket:** Run **`/do-linear-ticket`** then give the **issue id** (e.g. SYT-17) or **issue URL**. The agent fetches the issue, finds the spec, plans, and implements (after you approve). Same Linear MCP required.
- **Full pipeline to PR (yolo):** Run **`/signal-to-pr`** to do signal → spec → Linear → plan → implement → tests → **open a PR** in one go. Say "yolo" or "no approval" in the same message to skip the plan-approval step. Requires `gh` CLI installed and logged in. Defined in `.cursor/commands/signal-to-pr.md`.
- **Open a PR:** After implementing (e.g. with `/do-linear-ticket`), run **`/open-pr`** to stage, commit, push, and run `gh pr create --fill`. Optionally give a Linear issue id (e.g. SYT-17) to reference in the PR body. Defined in `.cursor/commands/open-pr.md`.

## Cursor setup

| File / folder | Purpose |
|---------------|---------|
| **AGENTS.md** | Agent identity and behavior: how to plan, when to ask, how to use tools. |
| **PRD.md** | Full project plan (vision, scope, features, priorities). The agent is instructed to use it for scope and alignment. |
| **.cursor/rules/** | Project rules the agent follows (workflow, conventions, code standards). |
| **.cursorignore** | Paths the agent skips when reading the codebase (optional; see below). |

### Optional: `.cursorignore`

Create `.cursorignore` at the repo root to exclude noise from agent context. Example:

```
node_modules/
.next/
dist/
build/
out/
.env
.env.*
!.env.example
.git/
*.log
```

### Rules in `.cursor/rules/`

- **agentic-workflow.mdc** — Planning with todos, small edits, verification.
- **project-conventions.mdc** — Repo structure, naming, config, dependencies.
- **code-standards.mdc** — Readability, error handling, immutability, types, security.
- **project-plan.mdc** — Tells the agent where the project plan lives (PRD.md or docs/) and to use it for scope and priorities.

Add more rules (e.g. `**/*.ts` or `**/*.tsx`) as you add a stack; keep each rule focused and under ~50 lines.

## Using this as a template

1. Clone or copy this repo.
2. Keep **AGENTS.md** and **.cursor/** as-is or tweak for your team.
3. Add stack-specific rules in `.cursor/rules/` when you introduce frameworks or languages.
4. Ensure `.env` is in `.gitignore` and never commit secrets.
