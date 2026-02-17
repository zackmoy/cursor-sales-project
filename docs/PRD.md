# Signal-to-Code: Customer Signal → Shipped Feature Pipeline

## Overview

Enterprise teams lose customer signal at every handoff. A feature request starts as words on a call, a vote on a feature board, a pattern in support tickets — and by the time a developer sees it, it's been translated multiple times and the customer's actual pain is gone.

**Signal-to-Code** is a Cursor-based prototype that ingests customer signal from three sources, triangulates the patterns, and turns the strongest signals into specs, code, and PRs with full attribution.

---

## Problem

Customer signal lives in three systems owned by three teams:

| Source | What It Captures | Signal Type |
|--------|-----------------|-------------|
| **Gong** (calls) | What customers *say* — conversations with your team | Conversational, unstructured, rich with context |
| **Canny** (feature boards) | What customers *formally request* — deliberate, voted on | Structured, community-prioritized |
| **Zendesk** (support tickets) | What customers *struggle with* — implicit needs via workaround patterns | Implicit, pattern-based, often overlooked |

No single source tells the full story. Gong captures what customers tell Sales (self-censored). Canny captures formal requests (deliberate but narrow). Zendesk captures what customers actually struggle with — the richest signal and the most commonly ignored.

The gap isn't data — it's turning scattered signals into one coherent spec and code with full attribution, without the developer context-switching across five tools.

---

## Solution: The Six-Stage Pipeline

```
[Gong MCP] ──→ ┐
[Canny MCP] ──→ ├──→ [Agent: Triangulate] → [Spec] → [Plan] → [Code + Tests] → [PR]
[Zendesk MCP] → ┘           ↑                                        ↓
                    [Signal Analysis Rules]               [Product Server MCP: Verify]
```

### Stage 1: INGEST
Agent pulls customer signal from all three MCP sources in one query. Returns call transcripts with participant metadata, feature requests with vote counts, and support tickets with workaround patterns.

### Stage 2: TRIANGULATE
Agent cross-references signals by feature/theme. Features appearing in all three sources are rated CRITICAL. Two sources = HIGH. Single source = MEDIUM. Weights by customer tier, deal size, vote count, and ticket volume.

### Stage 3: SPEC
Agent generates a feature specification with multi-source attribution: origin (which calls, requests, tickets), problem statement, customer quotes, requirements, acceptance criteria, test requirements, technical constraints, and UI/frontend scope.

### Stage 4: BUILD
Agent reads the spec, produces a numbered plan (services, routes, components, tests), waits for approval, then implements. Architecture rules enforce file structure, naming, Zod validation, and test coverage.

### Stage 5: VERIFY
Agent looks up the requesting customer via the Product Server MCP, verifies the feature is compatible with their tier and configuration, and flags blockers or warnings. Prospects are flagged for AE follow-up instead.

### Stage 6: SUBMIT
Agent creates a Linear ticket (or updates an existing one), then opens a PR with signal origin, spec reference, customer verification, and AI attribution.

---

## What's Implemented

### MCP Servers (4 mock + 1 real)

| Server | Type | Tools | Data |
|--------|------|-------|------|
| `gong-mock` | Mock | `search_calls`, `get_transcript`, `get_call_participants` | 4 calls across 4 companies with full transcripts |
| `canny-mock` | Mock | `search_feature_requests`, `get_request_details`, `get_request_voters` | 5 feature requests with varied vote counts and voter companies |
| `zendesk-mock` | Mock | `search_tickets`, `get_ticket_details`, `get_ticket_comments` | 12 tickets across 5 themes including noise/unrelated tickets |
| `product-server-mock` | Mock | `lookup_customer`, `verify_feature_compatibility` | 4 customers across 3 tiers with real capability gating and prerequisite checks |
| `linear` | Real (remote) | Full Linear API via OAuth | Real ticket creation and management |

### Rules (8 files in `.cursor/rules/`)

| Rule | Type | Purpose |
|------|------|---------|
| `signal-analysis.mdc` | Agent-requested | Governs how to ingest, triangulate, and rate signals; skips already-shipped features |
| `spec-template.mdc` | Agent-requested | Template for feature specs with multi-source attribution, test requirements, UI scope; runs architecture gates |
| `architecture.mdc` | Always | File structure, stack, naming, testing, domain language |
| `architecture-check.mdc` | Always | 4 review gates: persistence (Gate 1), auth (Gate 2), interfaces (Gate 3), input safety (Gate 4) |
| `code-standards.mdc` | Always | Readability, error handling, types, security |
| `project-conventions.mdc` | Always | Layout, naming, config, dependencies |
| `project-plan.mdc` | Always | Points to this PRD for scope and priorities |
| `agentic-workflow.mdc` | Always | Todo usage, edit style, verification |

### Slash Commands (6 files in `.cursor/commands/`)

| Command | What it does |
|---------|-------------|
| `/signal-to-spec` | Runs stages 1–3 (ingest → triangulate → spec) in one flow |
| `/spec-to-linear` | Creates a Linear issue from a spec file, checks for duplicates |
| `/do-linear-ticket` | Fetches a Linear issue, finds the spec, plans, implements after approval |
| `/open-pr` | Stages, commits, pushes, and opens a PR via `gh` CLI |
| `/signal-to-pr` | Full pipeline: signal → spec → Linear → plan → build → PR (with optional yolo mode) |
| `/review-pr` | Architecture + security + quality review on current diff (4 gates + OWASP checks) |

### Starter Codebase

| Component | Path | Description |
|-----------|------|-------------|
| Analytics Service | `src/services/analytics-service.ts` | Deterministic data generation with trends and weekly seasonality |
| Export Service | `src/services/export-service.ts` | CSV generation with date/range/metric validation (90-day limit, metric allowlist) |
| Analytics API | `src/api/routes/analytics.ts` | Express route with Zod validation |
| Export API | `src/api/routes/export.ts` | CSV export route with structured error codes, filename sanitization |
| Dashboard UI | `src/components/AnalyticsDashboard.tsx` | Metric cards, SVG bar chart, date range controls, Export CSV button |
| App Shell | `src/App.tsx` | Navigation bar with workspace context |
| App (importable) | `src/app.ts` | Express app setup (no side effects — safe for test imports) |
| Server | `src/server.ts` | Entrypoint: imports app and calls `listen()` |
| Feature Spec | `specs/csv-bulk-export.md` | Pipeline output: spec with multi-source attribution |

### Tests (30 tests across 4 files)

| Test File | Tests | Type | What it covers |
|-----------|-------|------|----------------|
| `analytics-service.test.ts` | 4 | Unit | Metrics, determinism, edge cases, non-negative values |
| `export-service.test.ts` | 12 | Unit | CSV generation + validation: invalid dates, range > 90 days, unknown metrics, end-before-start, boundary (exactly 90 days) |
| `export-route.test.ts` | 10 | Integration (supertest) | Happy path (content-type, headers, row count) + structured 400 errors for all validation codes |
| `smoke-export.test.ts` | 4 | Smoke (full HTTP) | Starts real Express server on random port, `fetch()` calls, verifies CSV and error responses over the wire |

**Stack:** Vite + React (TypeScript), Express, Zod, vitest, supertest

---

## Mock Data Design

Signal sources are designed with overlapping-but-not-identical data so the agent must reason through triangulation:

| Signal | Gong Calls | Canny Votes | Zendesk Tickets | Expected Rating |
|--------|-----------|-------------|-----------------|-----------------|
| CSV Export | 3 calls (Acme, Stark, Beta) | 47 votes + related "scheduled export" 18 votes | 5 tickets across 3 companies | CRITICAL |
| Dashboard Customization | 2 calls (Stark, Beta) | 31 votes | 3 tickets | HIGH |
| SSO / Azure AD | 1 call (Globex, deal-blocking) | 23 votes | 1 ticket | HIGH (single prospect) |
| Performance (90+ days) | 1 call mention | 14 votes | 1 ticket | MEDIUM |
| Noise (auth, billing) | — | — | 2 tickets | Filtered out |

The product-mock has 4 customers across 3 tiers with real compatibility logic:
- **Enterprise** (Acme, Stark): Full export, bulk operations, SSO, audit
- **Pro** (Initech): Export up to 10K rows, no bulk ops
- **Starter** (Beta): No export, no API access — verification correctly rejects export features

---

## Design Decisions

1. **Three signal sources, not one.** Triangulation surfaces the strongest patterns and avoids over-weighting a single voice. Tradeoff: more MCPs; benefit is higher-confidence prioritization.

2. **Rules + commands together.** Rules define *what* must be in specs and code. Commands define *how* the agent runs the workflow. Some duplication; benefit is consistency and versioned, reviewable flows.

3. **Spec as source of truth.** The spec includes origin, acceptance criteria, test requirements, and UI visibility. Implementation follows the spec. If the spec is silent on something, the rule says ask rather than guess.

4. **Mock MCPs first.** Same tool names and payloads as real integrations. Swap mocks for real APIs when deploying. Tradeoff: demo data is fixed; benefit is runnable anywhere without API keys.

5. **Human in the loop.** Plan approval before implementation (unless yolo mode). PR review by human. The agent parallelizes the handoff from signal to spec to code; the human focuses on review and product decisions.

---

## Limitations

- **Mock data.** MCP servers return pre-loaded data. Real integration requires Gong/Canny/Zendesk APIs, auth, pagination, and rate limits.
- **Context window.** Very long transcripts or large ticket sets could exceed model context. Mitigation: summarize per source before triangulation, or chunk and merge.
- **Single-shot demo flow.** The pipeline runs in one session. Production would likely involve Background Agents processing sources in parallel or on a schedule.
- **No GitHub MCP.** PR step uses `gh` CLI rather than the GitHub MCP server. PR description is generated by the agent and committed locally.

---

## Future Evolution

**Phase 2 — Real integrations:** Plug in real Gong/Canny/Zendesk APIs with the same tool contracts. Add CRM context (Salesforce/HubSpot MCP). Real GitHub MCP for PR submission.

**Phase 3 — Continuous signal monitoring:** Background Agents ingest new calls/requests/tickets on a schedule. Auto-triage into "build immediately" vs "needs product review." Weekly digest to Product with customer-weighted priority scores.

**Phase 4 — Outcome tracking:** After merge, track which shipped features were signal-originated. Time from first signal to shipped PR. Revenue attributed to signal-driven features.
