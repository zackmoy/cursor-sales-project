# Skills and Subagents: What to Extract

Recommendations for which project pieces are better suited as **Cursor Skills** (reusable knowledge) or **Subagents** (focused delegated workflows) vs staying as project rules/commands.

---

## Skills (reusable knowledge for other projects)

Skills are reusable patterns or expertise an agent can load. Good candidates are **method** or **practice** that don’t depend on this repo’s paths or stack.

| Current location | Candidate skill | Why |
|------------------|-----------------|-----|
| **signal-analysis.mdc** (plus triangulation steps in signal-to-spec) | **Multi-source signal triangulation** | The *method* — per-source summary, cross-source table, strength rating, weighting by role/customer/deal — is tool-agnostic. Another project might use different sources (e.g. Intercom + Pendo + Salesforce); the same “summarize then triangulate, don’t let loudest win” pattern applies. The skill would describe the steps and prioritization factors; source names (Gong, Canny, Zendesk) become parameters or examples. |
| **spec-template.mdc** (section list + rules) | **Spec-from-customer-signal** | Required sections (Origin, Problem, Customer quotes, Requirements, AC, Test requirements, UI/Frontend, Stakeholder routing) and rules (trace to signal, include UI when user-facing, define visibility/enablement) are reusable. The skill would define the template and rules; project rules would supply paths (e.g. `specs/`, `src/`) and stack. |
| **open-pr.md** (PR body structure) | **Outcome-focused PR body** | Practice of outcome line, Linear/ticket ref, “what changed,” implementation notes, and QA checklist (automated, API, UI, AC) is reusable. The skill would describe the structure and intent; project commands would supply repo-specific details (e.g. `specs/`, `npm test`). |

**How you’d use them:** In another repo you’d add a Skill that says “when doing multi-source prioritization, do X Y Z” or “when writing a spec from customer signal, use this template.” Project rules would still define *where* specs live and *what* the stack is; the Skill would define *how* to triangulate or *how* to structure the spec/PR.

---

## Subagents (focused delegated workflows)

Subagents are runs with a **narrow, single job** and bounded context. Good candidates are steps that are currently one long chain and would benefit from “hand off to a specialist” so the main agent doesn’t drift.

| Current flow | Subagent candidate | Scope | Benefit |
|--------------|--------------------|--------|---------|
| **Signal → spec** (ingest + triangulate + write spec in one run) | **Triangulation-only command** ✅ *Added* | **Only:** Ingest from available MCPs → per-source summary → cross-source table → pick top feature → output recommendation. No spec writing, no code. Implemented as **`/signal-triangulate`**. | Smaller context; “just prioritization” for quick checks or step-by-step demo. User can then run `/signal-to-spec` to produce the spec. |
| **Signal → spec** (same) | **Spec-writing subagent** | **Only:** Given “top feature = X” and evidence summary, write the spec file to the project’s spec path following the template. No ingest, no MCP calls, no implementation. | Focused task; no risk of re-triangulating or starting to code. Main agent (or user) provides the recommendation; subagent only produces the spec. |
| **Spec → implementation** (do-linear-ticket) | **Implementation subagent** | **Only:** Given a spec (and optionally Linear issue), plan and implement; run tests. No signal ingestion, no spec editing, no PR creation. | Stricter guardrails: this run cannot pull from Gong/Canny or change the spec; it only builds from the spec. Reduces scope creep. |

**How you’d use them:** You’d invoke a subagent (or a command that’s defined as “run with this focused system prompt”) for “triangulate only” or “write spec only” or “implement from spec only.” The main chat would orchestrate: e.g. “Run triangulation subagent → then run spec-writing subagent with that output → then run implementation subagent with that spec.”

---

## Keep as project rules/commands

These are **project-specific** or **orchestration** and should stay in `.cursor/rules` and `.cursor/commands`:

- **architecture.mdc, architecture-check.mdc** — This repo’s structure (src/, services, routes), stack (Vite, Express, Zod), domain language (workspace, analytics, export), and gates. Not generic.
- **project-plan.mdc, project-conventions.mdc, code-standards.mdc, agentic-workflow.mdc** — Repo-specific conventions and workflow.
- **Command orchestration** — signal-to-pr, signal-to-spec, spec-to-linear, do-linear-ticket, open-pr, review-pr define *this* project’s workflow and paths. The *content* of some steps (e.g. how to triangulate, how to structure a PR body) can be extracted into Skills; the “when to run what” and “where things live” stays in commands.
- **MCP config, hooks** — Project infrastructure.

---

## Summary

| Use case | Recommendation |
|----------|----------------|
| Reuse “how to triangulate” or “how to write a spec from signal” or “how to write an outcome PR” in another repo | Extract a **Skill** (multi-source triangulation, spec-from-signal template, outcome-focused PR body). |
| Keep triangulation, spec-writing, or implementation from drifting into each other | Use **Subagents** (triangulation-only, spec-writing-only, implementation-only) and have the main flow delegate to them. |
| Project paths, stack, conventions, and “what command runs when” | Keep as **rules and commands** in this repo. |

If you want, next step can be drafting a concrete Skill file (e.g. for multi-source triangulation) or a subagent-style prompt for “triangulation only” that you can plug into your workflow.
