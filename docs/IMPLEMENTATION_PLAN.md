# Signal-to-Code: Implementation Plan

This document is the **implementation plan** for building the full Signal-to-Code prototype in this repo. It derives from [PRD.md](./PRD.md) and [POC_Signal_to_Code_Architecture.md](./POC_Signal_to_Code_Architecture.md), and orders all work into phases with clear dependencies and deliverables.

---

## 1. Vision Summary (from PRD)

**Goal:** A pipeline that runs inside Cursor: **customer signal from three sources (Gong calls, Canny feature votes, Zendesk tickets) → ingest → triangulate → spec → code + tests → verification → PR**, with rules governing each step and MCP servers for Gong, Canny, Zendesk, product (customer verification), and GitHub.

**Six stages:**

| Stage | Name | Driver |
|-------|------|--------|
| 1 | INGEST | Mock Gong, Canny, Zendesk MCPs: pull signal from all three |
| 2 | TRIANGULATE | Cursor Agent + `signal-analysis` rule (cross-source correlation, signal strength) |
| 3 | SPEC | Cursor Agent + `spec-template` rule (multi-source attribution) |
| 4 | BUILD | Cursor Agent (Plan Mode) + `architecture` rule |
| 5 | VERIFY | Mock Product Server MCP: lookup_customer, verify_feature_compatibility |
| 6 | SUBMIT | GitHub MCP (real or narrated) + `pr-template` rule |

**Out of scope for this build:** Real Gong/Canny/Zendesk APIs, real product server, CI/CD, production error handling. Use mocks and minimal app.

---

## 2. Target Repository Layout

```
cursor-sales-project/
├── .cursor/
│   ├── mcp.json
│   └── rules/
│       ├── signal-analysis.mdc
│       ├── spec-template.mdc
│       ├── architecture.mdc
│       ├── domain-language.mdc
│       ├── pr-template.mdc
│       ├── visualize.mdc          # optional expansion
│       └── metrics.mdc             # optional expansion
├── mcp-servers/
│   ├── gong-mock/
│   │   ├── package.json
│   │   └── index.js
│   ├── canny-mock/
│   │   ├── package.json
│   │   └── index.js
│   ├── zendesk-mock/
│   │   ├── package.json
│   │   └── index.js
│   └── product-mock/
│       ├── package.json
│       └── index.js
├── src/
│   ├── services/
│   │   └── analytics-service.ts
│   ├── api/
│   │   └── routes/
│   │       └── analytics.ts
│   ├── components/                 # optional, for React UI
│   └── __tests__/
├── specs/                          # empty; agent writes specs here
├── dashboard/                     # optional expansion
│   ├── index.html
│   └── metrics.json
├── package.json
├── tsconfig.json
└── docs/
    ├── PRD.md
    └── IMPLEMENTATION_PLAN.md      # this file
```

---

## 3. Implementation Phases

### Phase 1: Project and MCP Foundation

**Goal:** Repo can run the four mock MCP servers (Gong, Canny, Zendesk, Product) and Cursor can talk to them.

| Step | Task | Deliverable |
|------|------|--------------|
| 1.1 | Root package.json with TypeScript, Zod, Express (or Next.js if preferred), vitest; tsconfig | `package.json`, `tsconfig.json` |
| 1.2 | `.cursor/mcp.json` with entries for `gong-mock`, `canny-mock`, `zendesk-mock`, `product-server-mock` (paths to `mcp-servers/...`) | `.cursor/mcp.json` |
| 1.3 | `mcp-servers/gong-mock`: npm init, add `@modelcontextprotocol/sdk`, `zod`; `"type": "module"`; tools `search_calls`, `get_transcript`, `get_call_participants`; 2–3 mock calls + transcripts (e.g. Acme Corp, Globex) | `mcp-servers/gong-mock/package.json`, `index.js` |
| 1.4 | `mcp-servers/canny-mock`: same setup; tools `search_feature_requests`, `get_request_details`; pre-loaded data that correlates with Gong (e.g. CSV export 47 upvotes) | `mcp-servers/canny-mock/package.json`, `index.js` |
| 1.5 | `mcp-servers/zendesk-mock`: same setup; tools `search_tickets`, `get_ticket_details`; pre-loaded ticket data (e.g. export/csv tags, Acme Corp tickets) | `mcp-servers/zendesk-mock/package.json`, `index.js` |
| 1.6 | `mcp-servers/product-mock`: same setup; tools `lookup_customer`, `verify_feature_compatibility`; mock customer (e.g. jane@acmecorp.com) | `mcp-servers/product-mock/package.json`, `index.js` |
| 1.7 | `npm install` in root and all mcp-servers; run from Cursor, confirm MCPs show connected in Cursor MCP settings | Manual verification |

**Reference:** PRD “Building the Mock Gong MCP Server” and “Building the Mock Product Server MCP”; [POC_Signal_to_Code_Architecture.md](./POC_Signal_to_Code_Architecture.md) for Canny/Zendesk tool names and triangulation data.

---

### Phase 2: Cursor Rules

**Goal:** Agent behavior for ingest/triangulate, spec, build, and PR is defined by rules.

| Step | Task | Deliverable |
|------|------|--------------|
| 2.1 | Signal analysis: source processing (Gong, Canny, Zendesk), triangulation, signal strength (Critical/High/Medium/Low), output format (cross-source map, per-feature deep dive) | `.cursor/rules/signal-analysis.mdc` |
| 2.2 | Spec template: required sections including Origin (multi-source attribution), Signal strength, Quotes from all channels, AI attribution | `.cursor/rules/spec-template.mdc` |
| 2.3 | Architecture: file layout (services, api/routes, components, __tests__, specs), naming, Zod, DI, domain language, testing, PR standards | `.cursor/rules/architecture.mdc` |
| 2.4 | Domain language: workspace, analytics, export, member (and what not to use) | `.cursor/rules/domain-language.mdc` (or folded into architecture) |
| 2.5 | PR template: Signal Origin (multi-source table), Spec reference, Changes, Customer verification, AI attribution, Stakeholder @mentions, auto-standup snippet | `.cursor/rules/pr-template.mdc` |

**Reference:** PRD “PIECE 1: Rules”; exact YAML frontmatter and body text are in the PRD and POC_Signal_to_Code_Architecture.md.

---

### Phase 3: Starter Codebase

**Goal:** Minimal app so the agent can “integrate with” existing analytics (e.g. CSV export feature) instead of building from zero.

| Step | Task | Deliverable |
|------|------|--------------|
| 3.1 | `AnalyticsService`: `DateRange`, `AnalyticsQuery`, `AnalyticsResult`; `query()` returning mock data | `src/services/analytics-service.ts` |
| 3.2 | Analytics route: POST `/query` with Zod-validated body, calls `AnalyticsService` | `src/api/routes/analytics.ts` |
| 3.3 | Wire route into app entry (e.g. Express app or Next.js API route) | `src/app.ts` or `src/pages/api/` / `app/api/` |
| 3.4 | Create empty `specs/` and `src/__tests__/` with a single placeholder or example test so structure exists | `specs/.gitkeep` or README; `src/__tests__/analytics-service.test.ts` (minimal) |

**Reference:** PRD “PIECE 3: The Starter Codebase”; interfaces and route schema are in the PRD.

---

### Phase 4: End-to-End Demo Path

**Goal:** One full pass through the pipeline in Cursor: Fetch → Analyze → Spec → Plan → Build → Verify → PR (or PR description).

| Step | Task | Deliverable |
|------|------|--------------|
| 4.1 | Document a “Demo script” (prompts and order) in a single place (e.g. `docs/DEMO_SCRIPT.md` or section in PRD) for: fetch calls → get transcript → analyze → spec → plan → build → verify → PR text | `docs/DEMO_SCRIPT.md` or PRD section |
| 4.2 | Add `get_account_contacts` to product-mock if PRD’s “Stage 5” / PR template expect AE/SE lookup | Optional: `mcp-servers/product-mock/index.js` |
| 4.3 | Run through the demo once; fix any path/config errors (mcp.json paths, `type: "module"`, etc.) | Working demo run |
| 4.4 | Note 1–2 “rough edges” (rules not firing, MCP tool choice, truncation) for the “Rough Edge” beat in the PRD | Short list in `docs/ROUGH_EDGES.md` or in DEMO_SCRIPT |

**Reference:** PRD “Demo Script (30 Minutes)” and “Verifying It All Works”.

---

### Phase 5: Optional Expansions (If Time)

**Goal:** Differentiator and “platform” story without overbuilding.

| Step | Task | Deliverable |
|------|------|--------------|
| 5.1 | **Visualize:** Rule that asks the agent to output Mermaid (sequence for calls, pie for request frequency, flowchart for pipeline) | `.cursor/rules/visualize.mdc` |
| 5.2 | **Metrics:** Rule that after PR/submit updates a JSON file for dashboard consumption | `.cursor/rules/metrics.mdc` |
| 5.3 | **Dashboard:** Single HTML file (e.g. Tailwind CDN + Chart.js) that reads `dashboard/metrics.json`; agent or script writes metrics | `dashboard/index.html`, `dashboard/metrics.json` |
| 5.4 | **Linear:** Add real Linear MCP to `mcp.json` and doc the “create/update ticket” step, OR add a minimal mock Linear MCP with `create_ticket` / `update_ticket` | `.cursor/mcp.json` and/or `mcp-servers/linear-mock/` |
| 5.5 | **GitHub:** Add real GitHub MCP to `mcp.json` (env: `GITHUB_PERSONAL_ACCESS_TOKEN`); document that PR creation is live | `.cursor/mcp.json`, `docs/DEMO_SCRIPT.md` |

**Reference:** PRD “Expanding the Prototype: From Demo to System” (Layers 3–5).

---

## 4. Build vs Mock vs Don’t Build

| Item | Decision |
|------|----------|
| Gong API | **Mock** — gong-mock MCP only |
| Canny API | **Mock** — canny-mock MCP only |
| Zendesk API | **Mock** — zendesk-mock MCP only |
| Product Server | **Mock** — product-mock MCP only |
| GitHub | **Real** (if PAT available) or **Narrate** — show PR description only |
| Linear | **Real** (if account) or **Mock** (create_ticket, update_ticket) or **Skip** |
| Code generation | **Real** — agent generates code and tests in Cursor |
| CI/CD, production hardening | **Don’t build** |

---

## 5. Dependency Order (Critical Path)

1. **Phase 1** (MCP servers + mcp.json) — nothing else works without these.
2. **Phase 2** (Rules) — can be done in parallel with Phase 3.
3. **Phase 3** (Starter codebase) — needed before “Build” step of the demo.
4. **Phase 4** (Demo path + verification) — after 1–3.
5. **Phase 5** (Visualize, metrics, dashboard, Linear, GitHub) — optional after 4.

---

## 6. Verification Checklist (Pre-Demo)

- [ ] `npm install` at repo root and in all four `mcp-servers/*` directories.
- [ ] Open project in Cursor; MCPs show as connected (green) in Settings → MCP.
- [ ] Agent can “search Gong calls” and “get transcript” for a mock call.
- [ ] Agent can “lookup_customer” for jane@acmecorp.com and get mock account.
- [ ] Agent can run Canny and Zendesk MCP tools and get correlating mock data.
- [ ] Rules exist and globs/descriptions match where the agent will work (specs, src, etc.).
- [ ] Starter app runs (e.g. `npm run dev` or `npm start`) and analytics route responds.
- [ ] One full pipeline run: ingest (Gong + Canny + Zendesk) → triangulate → spec → plan → build (at least one file + one test) → verify → PR description.

---

## 7. Demo Mechanics: What Is the "Product" and How Do You Install This?

### How does the demo work if we don't have an actual product?

You **do** have a "product" in the demo—it's just **minimal on purpose**:

- **Starter codebase** = The small app in this repo (`src/services/analytics-service.ts`, `src/api/routes/analytics.ts`, etc.). It **stands in** for "the company's real product." It's not a full SaaS; it's the **smallest thing that gives the agent something to extend** (e.g. "add CSV export that uses our existing AnalyticsService").
- **Mock signal** = Gong, Canny, and Zendesk MCPs return **pre-written data** (Acme Corp, Globex, 47 Canny upvotes, 12 Zendesk tickets). No real CRM or support desk is involved.
- **Mock product server** = The "product server" MCP is **not** your application. It's a stand-in for an internal **customer-account system** (tier, config, who's the AE/SE). It returns fake data so the agent can show "verify this feature for Acme Corp."

So the demo works **without a real shipped product** because: (1) the "product" being extended is the starter app in the repo, and (2) all customer/signal data is mocked. You're demonstrating the **workflow and the pipeline**, not a specific commercial product.

### What is the "product" I would be demoing?

Two different ideas use the word "product" in the PRD; it helps to keep them distinct:

| Term | Meaning in this repo | What you're demoing |
|------|----------------------|----------------------|
| **The product (app)** | The **starter codebase** in `src/` (e.g. AnalyticsService + routes). It's the thing the agent **adds a feature to** (e.g. CSV export). | "Here's our (minimal) app; the agent is adding a customer-requested feature to it." |
| **Product Server** | A separate MCP that represents an internal **customer/account system** (lookup_customer, verify_feature_compatibility). Mock in the demo. | "We'd call our real customer system here; for the demo we use mock data." |
| **What you're actually selling in the interview** | — | The **pipeline**: Cursor + rules + MCPs turning customer signal into specs, code, and PRs. The "product" you're demoing is **this workflow**, not the starter app itself. |

So in the interview you're demoing: **"This is how a developer would use Cursor to go from customer signal (calls, votes, tickets) to a spec, to code, to a PR—with full attribution."** The starter app is just the **target** of the generated code so the agent has a real codebase to edit.

### How would I "install" this into an existing enterprise codebase?

You don't install a new application. You add **Cursor customization** to their **existing repo** so that when their developers open that repo in Cursor, they get the pipeline (rules + MCPs). Concretely:

**1. Add to their repo (or a fork they use for this workflow):**

- **`.cursor/rules/`** — Copy (then adapt) the rule files:
  - `signal-analysis.mdc`, `spec-template.mdc`, `pr-template.mdc` can stay largely as-is.
  - **`architecture.mdc`** and **`domain-language.mdc`** must be **customized** to their stack (paths, naming, frameworks, domain terms). Their codebase is the source of truth.
- **`.cursor/mcp.json`** — Add MCP entries. Paths or commands must point to where the MCP servers actually run (see below).

**2. MCP servers (who runs them, where):**

- **Option A — They run MCPs:** They (or their platform team) run the Gong, Canny, Zendesk, and "product server" MCPs on their network. Their `.cursor/mcp.json` points to those (e.g. `node ./mcp-servers/gong-mock/index.js` or a wrapper that calls a real API). Real integrations would replace the mocks.
- **Option B — You provide MCP server code:** You give them the mock (or real) MCP server code in something like `mcp-servers/` in the repo or a separate repo. They run it locally or in an internal service and point `mcp.json` at it. No "installing" an app into their codebase—just adding config and optionally scripts they execute.

**3. What you don't install:**

- You do **not** install a standalone "Signal-to-Code app" or change their build/deploy pipeline by default. The pipeline is **Cursor + rules + MCPs**; their existing codebase stays the same except that Cursor now has rules and tools when opened on that repo.

**4. Minimal "installation" checklist for an enterprise:**

1. Copy `.cursor/rules/*.mdc` into their repo (adapt architecture and domain-language to their codebase).
2. Add `.cursor/mcp.json` with entries for Gong, Canny, Zendesk, product server, and (optionally) GitHub/Linear.
3. Ensure MCP servers are runnable (by them or you) and that Cursor can reach them (local processes or configured URLs).
4. Optionally add a `specs/` directory (or match the path in the rules) where generated specs will land.
5. Train the team: "Open this repo in Cursor; use the agent to pull signal, triangulate, generate a spec, and build—following our rules."

So: **the "product" in the demo is the minimal starter app + the pipeline (rules + MCPs). Installing into an enterprise codebase means adding those Cursor rules and MCP config (and running the MCPs) against their real repo and, over time, replacing mocks with real Gong/Canny/Zendesk/product-server integrations.**

---

## 8. Where to Find Details

- **Pipeline stages, demo script, Q&A:** [PRD.md](./PRD.md)
- **Exact rule content and MCP code:** PRD “PIECE 1: Rules”, “Building the Mock Gong MCP Server”, “Building the Mock Product Server MCP”, “PIECE 3: The Starter Codebase”
- **Expansion (visualize, metrics, dashboard, Linear):** PRD “Expanding the Prototype: From Demo to System”
- **Rough edges and FDE narrative:** PRD “The Rough Edge Beat” and “Demo Day Prep Checklist”

Use this plan to execute the build in order; refer back to the PRD for exact copy, code snippets, and product narrative.
