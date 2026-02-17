# Slide deck: Same method, more of the workflow

Use this to build a short slide deck (e.g. 5–7 slides). Copy each "Slide" section into your tool (Google Slides, Keynote, Pitch, etc.). The table can be one slide or split across two.

---

## Slide 1 — Title

**Same method, more of the workflow**

*Where else could signal → spec → build improve engineering speed?*

---

## Slide 2 — The pattern

**One pattern, many handoffs**

Ingest **signal** → turn into **spec** (rules enforce format) → **plan** → **build** → **verify** → **PR**

The POC uses **customer voice** (Gong, Canny, Zendesk). The same primitives—rules, MCP, agent—apply to other parts of the engineering lifecycle.

---

## Slide 3 — The table (full)

**Workflow parts the same method could improve**

| Workflow part / signal | What gets ingested | Speed improvement |
|------------------------|-------------------|-------------------|
| **Incident → fix** | Pagerduty/Sentry ticket, stack trace, logs | Incident → spec for fix → code change + test. Faster from page to patch. |
| **Security / compliance** | Scanner output (Snyk, Semgrep), audit checklist | Findings → spec → code/config changes. Audit to remediation in one flow. |
| **Design handoff** | Figma, screenshots, or design spec | Design → acceptance criteria → implementation. Design-to-code. |
| **Code review feedback** | PR comments | Comments → spec → agent implements. Review to resolution. |
| **Dependency / upgrade** | Deprecation, CVE, "upgrade to Node 20" | Signal → migration spec → code + tests. Faster dependency management. |
| **Documentation drift** | Diff between docs and code, or "docs outdated" ticket | Signal → spec → doc or code update. Keeps docs in sync. |
| **Retro / improvement** | Retro items, "what went wrong," eng feedback | Items → spec → implementation. Retro to actionable change. |
| **API / contract** | OpenAPI, gRPC proto, or API contract change | Contract as spec → client code, adapter, or tests. Contract-first in one run. |

---

## Slide 4 — The table (split: part 1)

**Where the same method could improve speed (1 of 2)**

| Workflow part | What gets ingested | Speed improvement |
|---------------|-------------------|-------------------|
| Incident → fix | Pagerduty/Sentry, stack trace, logs | Page → spec → patch |
| Security / compliance | Snyk, Semgrep, audit checklist | Findings → spec → remediation |
| Design handoff | Figma, screenshots, design spec | Design → spec → implementation |
| Code review feedback | PR comments | Comments → spec → agent implements |

---

## Slide 5 — The table (split: part 2)

**Where the same method could improve speed (2 of 2)**

| Workflow part | What gets ingested | Speed improvement |
|---------------|-------------------|-------------------|
| Dependency / upgrade | Deprecation, CVE, version bump | Signal → migration spec → code + tests |
| Documentation drift | Docs vs code, "docs outdated" ticket | Signal → spec → update |
| Retro / improvement | Retro items, eng feedback | Items → spec → implementation |
| API / contract | OpenAPI, gRPC proto, contract change | Contract → client/adapter/tests |

---

## Slide 6 — Unifying idea

**One pattern, one stack**

In every case:

1. A **signal** (ticket, finding, design, comment, contract) is ingested.
2. It’s turned into a **structured spec** (rules enforce format and quality).
3. The **agent** plans and builds with the same architecture and test discipline.

We chose **customer signal** for the POC because it’s the highest-friction handoff in most orgs. The primitives (rules, MCP, agent) are the same for incidents, security, design, or review.

---

## Slide 7 — Close / Q&A

**Takeaway**

- **POC:** Customer voice (Gong, Canny, Zendesk) → spec → code → PR.
- **Same method** could apply to: incidents, security findings, design handoff, PR comments, dependency upgrades, docs, retro, API/contract.

*Questions?*

---

## Why this changes the game (and why it's meaningful)

**Customer pain is the wedge.** Frances's feedback was clear: enterprise deals turn on *direct feedback from customers* — closing the loop from "what they said" to "what we shipped." The POC does that: Gong + Canny + Zendesk → spec → code → PR with full attribution. That's the story that wins deals and differentiates Cursor in the enterprise.

**The framework is the multiplier.** We're not just building "a customer-signal tool." We're showing that **one pattern** — ingest signal → structured spec (rules) → plan → build → verify → PR — applies wherever there's a high-friction handoff from "something happened" or "we need X" to shipped code. Same primitives (rules, MCP, agent); different signals.

**Why that's meaningful:**

1. **One platform, many use cases.** Enterprise doesn't want a different tool for customer feedback, security findings, postmortems, and design handoff. They want one orchestration layer (Cursor) that can run the same disciplined flow for each. "We use Cursor for customer-signal-to-code *and* for incident-to-fix *and* for audit-to-remediation" is a stickier, broader story than "we use Cursor for customer signal."

2. **You're defining a repeatable engagement pattern.** For FDE, the value isn't "we did one cool demo." It's "here's a pattern we can deploy in every engagement." Customer signal is the first instantiation; security, tech debt, docs drift, postmortems, retros are other instantiations. That's how you scale the function — same playbook, different lens.

3. **It answers "so what?"** If the POC were only "customer voice → code," an evaluator could say "nice, but narrow." The framework says: "We chose customer pain because it's the highest-friction handoff and what enterprise cares about most. The same method applies to the rest of the lifecycle — security, reliability, design, review. One pattern, many handoffs." That's a product vision, not a one-off demo.

**Bottom line:** Customer pain (Frances's point) is the *wedge* — it's what we built and what we lead with. The framework (same pattern across security, tech debt, docs, postmortems, retros) is the *expansion story* — it's what makes the POC meaningful beyond a single use case and what gives FDE a repeatable, scalable playbook.

**Stripe alignment (for metrics / Q&A):** Stripe's internal coding agent uses **PRs produced without human code** as their north star — not "AI wrote X lines" or "Y% of code." We're aligned: our metric is shippable PRs (and customer gaps closed with traceability), not volume. Same pragmatic playbook: powerful models + quality tooling (MCPs, rules) + humans in the loop. See DEMO_SCRIPT "Pragmatic playbook: Stripe-style lessons" for the full mapping.

---

## Source

Content pulled from **DEMO_SCRIPT.md** (“Other workflow parts and signals the same method could improve”). Table is also in **Gap_Analysis_vs_Prompt (1).md** in summary form.
