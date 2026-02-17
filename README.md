# cursor-sales-project

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
