# Signal-to-Code: Live Demo Script

Use this when demoing **pull signal → triangulate → spec → build code** in Cursor. The mock MCP servers (Gong, Canny, Zendesk, Product) must be running and connected.

**Format:** 30-minute live demo + 15-minute Q&A (per [PROJECT_PROMPT.md](PROJECT_PROMPT.md)).

---

## Presenting against the project prompt

**Include all of the following in your demo.** The sections below are the script: problem, ROI framing, three benefits, design decisions, limitations, evaluation mapping, and pacing. Use them as your talking points; the working walkthrough (Steps 1–6) comes after.

### Real-world software development workflow (addressing the prompt)

The prompt asks for a prototype that "meaningfully improve[s] a real-world software development workflow." **Real-world development already includes feedback from customers and prospects:** support tickets (Zendesk), feature requests and votes (Canny), and sales/customer calls (Gong). Those signals exist in every enterprise; the gap is that they live in separate systems and rarely reach the developer as one coherent, attributable story. This prototype starts there: we show Cursor ingesting exactly those real-world signals, triangulating them, and turning them into a spec and code with full traceability. That *is* a real-world workflow—the one teams already have, improved by reducing handoff loss and context-switching.

**Optional line for the intro:** "Real-world software development isn’t just writing code—it’s responding to customer feedback in Zendesk, feature votes in Canny, and what prospects say on Gong calls. Our prototype shows Cursor improving that workflow by pulling those signals into one place and turning them into a spec and code with full attribution."

### Problem we chose and why it matters (enterprise context)

**Problem:** Enterprise teams lose customer signal at every handoff. A feature request appears as words on a Gong call, a vote on Canny, and patterns in Zendesk tickets — but those live in three different systems. By the time a developer sees a Jira ticket, the customer’s pain has been translated multiple times and the evidence is gone. Prioritization becomes guesswork; traceability from “what we shipped” back to “which customer and which deal” is rare.

**Why it matters:** Enterprises already have Gong, Canny, Zendesk (or equivalents). The gap isn’t data; it’s turning that signal into one coherent spec and code with full attribution, without the developer context-switching across five tools. This prototype shows Cursor doing exactly that: ingest → triangulate → spec → code → verify, with rules and MCPs that mirror real enterprise constraints.

### ROI: tie customer pain points to AI usage

**Include this in the demo:** By tying specific customer pain to specific AI usage, we show ROI clearly: *AI usage solved THIS pain point.*

TODO: Mention Stripe here.

- **Customer pain (from signal):** e.g. “My analysts are literally screenshotting charts and manually copying numbers. We need CSV export for our Q1 board; if we can’t get it we may have to evaluate alternatives.” (Gong) + 47 Canny upvotes + 5 Zendesk tickets on export.
- **What the AI did:** Ingested that signal from three sources → triangulated to one top feature (CSV bulk export) → wrote a spec with origin, requirements, and test requirements → produced the implementation (API + UI + tests) and verification against that customer’s tier.
- **The tie:** The spec and the shipped feature both reference the same customer (Acme Corp), the same quote, and the same Canny/Zendesk evidence. So we can say: *“This CSV export feature exists because the AI turned this customer’s pain and this evidence into this spec and this code. Here’s the line from the spec; here’s the code; here’s the test. ROI: we closed this gap for this customer with full traceability.”*

Make this explicit when you walk through the spec and the build: point to the **Origin** and **Customer quotes** in the spec, then to the code and the Export CSV button. That’s how you show that AI usage solved a specific, attributable pain point — and how enterprises can measure AI ROI in terms of customer impact, not just “AI wrote some code.”

### How we demonstrate the three benefits

| Benefit (from prompt) | How the prototype shows it |
|----------------------|----------------------------|
| **Improve developer velocity** | One flow replaces the chain (Gong → CRM → Jira → Sprint → Code → PR). Signal to spec in one command (`/signal-to-spec`); spec to Linear ticket to implementation in two more (`/spec-to-linear`, `/do-linear-ticket`). PR review via `/review-pr`. Same feature from signal to reviewed PR in one session. |
| **Reduce cognitive load** | Developer stays in Cursor. No switching to Gong, Canny, Zendesk, or Jira to gather context. The agent pulls from all three, triangulates, and produces a single spec. Plan-and-implement is one conversation with approval at the right step. |
| **Increase code quality, safety, consistency** | Rules enforce architecture (services, routes, components, tests), spec template (origin, acceptance criteria, **test requirements**, UI visibility). Every feature must include tests that map to acceptance criteria; `npm test` before done. Zod on API; traceability from spec to PR. **Architecture-check rule** (4 gates: persistence, auth, interface changes, input safety) catches issues before code is written — see "Second run" and `/review-pr`. 30 tests including a full HTTP smoke test. |

### Design decisions and tradeoffs

- **Three signal sources, not one:** Triangulation (Gong + Canny + Zendesk) surfaces the strongest feature and avoids over-weighting a single loud voice. Tradeoff: more MCPs and rules; we accept that for higher-confidence prioritization.
- **Prioritization isn’t “loudest wins”:** The agent weights signal by **role** (e.g. VP/CTO/Director vs IC — from Gong participant title), **customer status** (existing customer vs prospect, and tier — from product server `lookup_customer`), and **sales potential** (tier, seats, or Canny voter company value). So long-time or high-value customers and decision-makers count more than a single loud prospect or IC. In real deployments you’d plug in CRM deal size; here we use product tier and Canny company data as proxies. One line for the demo: “We don’t just count votes — we weight by who said it, whether they’re an existing customer, and deal potential.”
- **Rules + commands together:** Rules (e.g. `spec-template`, `architecture`) define *what* must be in specs and code. Commands (`/signal-to-spec`, `/do-linear-ticket`) define *how* the agent runs the workflow. Tradeoff: some duplication; benefit is consistency and versioned, reviewable flows.
- **Configurable signal window:** The “recent” window for pulling signal (e.g. Gong calls) is configurable. **Default: last two weeks** — enough to triangulate, recent enough to be actionable. **Startups** often want “last week” (feedback comes in constantly; they want to react to what’s hot). **Enterprises** may want “last month” (more stakeholders, monthly review cycles, need volume before prioritizing). The user can say “from the last week” or “last month” when running `/signal-to-spec` or `/signal-to-pr`; the agent uses that. One line for the demo: “This is configurable — we default to two weeks, but a fast-moving team might say last week, and a larger org might say last month.”
- **Spec as source of truth:** Spec includes origin, acceptance criteria, **test requirements**, and **UI visibility/enablement**. Implementation follows the spec; if the spec is silent (e.g. “when is the button shown?”), the rule says ask rather than guess. Tradeoff: specs are longer; benefit is fewer “we forgot the UI” or “we shipped without tests” surprises.
- **Mock MCPs with real API schemas:** Demo uses mock Gong/Canny/Zendesk/Product servers so the pipeline runs without real API keys. The mocks aren't toy data — they return responses shaped to match the **real vendor API schemas**: Gong API v2 call/transcript/party objects, Canny API v1 post/vote/board/user objects, Zendesk Support API v2 ticket/comment objects with snake_case fields, integer IDs, `via` objects, and standard response envelopes. Same tool names, same field names, same nesting. Swap mocks for real API credentials and the agent's behavior doesn't change. Tradeoff: demo data is fixed; benefit is runnable in 30 minutes and zero refactoring when going live.

### Limitations and how we’d evolve

- **Mocks vs real APIs:** Today we use mock MCPs. The schemas already match the real APIs (Gong v2, Canny v1, Zendesk v2) so the swap is config-only: point `.cursor/mcp.json` at real MCP servers (Gong has an official MCP; Zendesk has community ones; Canny would need a thin wrapper), add auth credentials, and handle pagination/rate limits. The agent's rules, commands, and prompts don't change.
- **Scale and context:** Very long transcripts or huge ticket lists could exceed context. We keep signal volume small in the prototype and have the agent produce a **per-source summary** before the cross-source table (summarize then triangulate). Evolution: see “Scaling signal (future work)” below.
- **Human review:** Spec and code are AI-generated; human still approves the plan and reviews the PR. Evolution: add PR review rules (e.g. security, architecture) and optional “draft PR” automation; keep human in the loop for scope and customer impact.
- **More of the lifecycle:** We added Verify (product server), PR description, and Linear. Evolution: wire GitHub MCP for real PR creation; add a “post-merge” step (e.g. notify AE, update CRM) when the team’s process requires it.
- **PII in signal data:** MCP responses (Gong transcripts, Canny voters, Zendesk tickets) contain PII and reach the engineer’s Cursor session. See “PII and security of signal data” below for access control, redaction, and compliance talking points.

### PII and security of signal data (Q&A / enterprise)

**The concern:** When the agent queries Gong, Canny, and Zendesk via MCP, the responses include **PII and sensitive business data**: participant names and emails, company names, call transcripts, ticket text, and voter/requester details. That data flows into the Cursor session and is visible to the engineer running the command. So we’re exposing customer/prospect data to the developer’s context — which is exactly what “traceability” requires, but it raises security and compliance questions.

**What the project doesn’t do today:** We don’t redact PII, we don’t restrict who can run the signal commands, and we don’t define where Cursor stores or indexes MCP response data. The demo uses mocks; with real APIs, credentials and data handling become the customer’s responsibility.

**Does Cursor see your prompts? Is there exposure beyond the engineer or PM?**

Yes — potentially. The concern isn’t only “PII is visible to the person in the session.” Enterprises will ask:

- **Does Cursor (the company) see prompts and completions?** Chat content, including what the user types and what the agent returns (and thus any MCP response data that the agent includes in its replies), may be sent to Cursor’s infrastructure to run the model. Whether Cursor stores that, logs it, or uses it for product improvement or training is defined in **Cursor’s privacy policy and terms** — not in this repo. We don’t speak for Cursor; point customers to Cursor’s official data and privacy documentation.
- **Model providers:** If Cursor routes requests to third-party models (e.g. OpenAI, Anthropic), then prompts and context (including MCP output that’s in the conversation) may be processed by those providers under their and Cursor’s policies. Enterprises should confirm with Cursor: where does the request go, is there a BAA/DPA, and do they offer on-prem or private-model options for sensitive workloads?
- **Exposure beyond the engineer/PM:** So the full chain can be: (1) data visible in the session to the user, (2) data sent to Cursor’s servers to run the agent, (3) data possibly sent to or processed by model providers, (4) possible logging or retention by Cursor or the provider. “Only the engineer sees it” is the minimum; in practice, “who else sees it?” is a question for Cursor and for the customer’s DPA/security review.

**What to say:** “Cursor’s privacy policy and terms define whether they see your prompts, how long they’re retained, and whether they’re used for training or product improvement. For MCP data specifically — Gong transcripts, ticket text — that content can end up in the conversation, so it’s subject to the same data flow as the rest of the chat. We recommend enterprises get this in writing: DPA, SOC 2, or a clear statement from Cursor on no training on customer data and where data is processed. This prototype doesn’t change Cursor’s data practices; it just means the *content* flowing through the session can include sensitive customer signal.”

**Talking points for “how do we keep it secure?”**

| Control | What to say |
|--------|-------------|
| **Access control** | Restrict who can run `/signal-to-spec` or `/signal-triangulate` (and who has the Gong/Canny/Zendesk MCPs connected). In practice that means: only engineers (or PMs/AEs) with a need-to-know for customer feedback should have those MCPs enabled; use Cursor teams/workspace settings or SSO so the same people who already access Gong/Zendesk in the browser are the ones whose Cursor can call them. “Same principle as today — not everyone has Gong access; the pipeline doesn’t change that, it just moves the access into Cursor.” |
| **Credentials** | API keys and OAuth for Gong, Canny, Zendesk must live in env vars or a secrets manager, never in chat or in the repo. MCP servers should be configured to use those credentials; the agent never sees the raw secret. |
| **Minimize what’s persisted** | Specs and PRs should carry only what’s needed for traceability: e.g. company name and role (“VP at Acme”), not necessarily full transcripts or raw emails. Customer quotes can be summarized or anonymized when the spec is shared outside a need-to-know circle. “We want traceability for prioritization; we don’t have to paste the whole transcript into the PR.” |
| **Proxy / redaction layer** | For stricter compliance, an enterprise could put a **proxy MCP** (or middleware) in front of Gong/Canny/Zendesk that redacts or tokenizes PII (e.g. replace names with “Customer A”, emails with hashes) before responses reach the agent. Triangulation and prioritization still work; traceability becomes “Customer A (Enterprise)” instead of “Jane Smith, jane@acmecorp.com.” Tradeoff: you lose direct attribution in the spec unless you rehydrate server-side. |
| **Cursor product** | **Does Cursor see your prompts?** Yes, in the sense that chat content (including MCP response data in the thread) is sent to Cursor to run the agent; it may also be processed by model providers. Whether Cursor stores it, uses it for training, or shares it is in Cursor’s privacy policy and terms. Exposure isn’t limited to “only the engineer sees it” — get the full data flow in writing (DPA, SOC 2, no-training commitments). See the “Does Cursor see your prompts?” paragraph above. |
| **Compliance** | Transcripts and tickets are **personal data** (GDPR, etc.). Enterprises need a lawful basis to process them and to feed them into an AI-assisted workflow. That’s unchanged by MCP — they already have that data in Gong/Zendesk. The new part is “now it’s also in the developer’s Cursor context”; so access control, retention, and minimum necessary exposure (e.g. per-source summary instead of full dump) all matter. |

**One line for the demo:** “MCPs do expose PII to the engineer’s session — names, companies, quotes. We keep it secure the same way we do today: access control (only people who already have Gong/Zendesk access), credentials in env, and we don’t persist more than we need. For stricter environments, a redaction proxy in front of the MCPs is the next step.”

### Scaling signal (future work)

Today the prototype uses a **bounded signal window** and the agent reads a small set of calls, Canny requests, and tickets. There is **no indexing**, **no persistent signal store**, and **no similarity-based clustering**. That’s intentional for the demo; at real volume you’d need the following (document here for future work, not in the prototype):

| Direction | What to add | Why |
|-----------|-------------|-----|
| **Summarize before triangulation** | Per-source summarization at ingest (e.g. one short summary per call or per ticket batch). | Keeps context bounded; the agent works on a summary layer, not raw transcripts. The prototype already asks for a per-source summary in the command; at scale this would be a dedicated step or pipeline that writes summaries into a store. |
| **Chunk and retrieve** | Store signal in chunks (per call, per ticket, per Canny post). At request time, **retrieve** only relevant chunks (by time, topic, account) instead of loading everything. | Prevents “dump the whole world into the prompt.” Implies a store (DB, search index, or vector store) and a retrieval step before the agent runs. |
| **Embed and cluster** | Embed text (summaries or key sentences) into vectors; use similarity search (e.g. cosine, ANN) to cluster “same ask, different words” across Gong, Canny, Zendesk. Rank clusters by cross-source strength and by role/deal weight. | Deduplicates and finds themes at scale without the model reading every sentence. Tokenization/embedding + similarity is how you go from “lots of noisy mentions” to “prioritized, deduplicated themes.” |
| **Incremental indexing** | Pipeline that, as new calls/tickets/votes arrive, ingests → summarizes → embeds → writes into the store. Signal-to-spec then **queries the index** (and maybe a few live MCP calls for detail) instead of re-processing everything each time. | Makes the system scalable and up to date; the index is the source of truth that gets updated continuously. |
| **Who owns the index?** | Either **Cursor** (or a Cursor-backed service) indexes for customers and the agent queries that, or the **customer** (or integrator) runs the indexing pipeline and exposes a query API/MCP that the agent calls. | Product decision; either way, something has to index so retrieval is bounded and relevance-based. |
| **Human-in-the-loop triage** | System suggests “top N themes” from clustering + ranking; human confirms or reorders; then the agent writes specs for the chosen theme(s). | At scale, triage becomes a separate step so the agent’s job stays scoped and auditable. |

**For the demo / Q&A:** “We keep signal volume small for the prototype and have the agent summarize per source before triangulating. At scale we’d add proper summarization, a signal index, and embedding-based similarity so the same pipeline works over hundreds of calls and tickets. That’s future work we’ve scoped but not built.”

### Additional signals that would make it more like real-world dev (evolution)

Today we use **three** signals: Gong (what prospects/customers say), Canny (what they vote for), Zendesk (what they struggle with). Real-world workflows often also involve:

| Signal | What it adds | How it would fit |
|--------|----------------|-------------------|
| **Existing backlog (Jira / Linear)** | "Is this already a ticket?" Avoids duplicate work; enriches existing issues with customer evidence. | We already use Linear for *output* (create/update issues from spec). Adding it as *input*: before or during triangulation, the agent queries Linear (or Jira MCP) for open issues matching the theme; if there's a match, the spec links to that issue and we comment instead of creating new. Makes the pipeline respect current backlog. |
| **Feature / product usage** | What do users *do*, not just say? Usage DB (e.g. feature adoption, drop-off, errors by flow). | MCP or API that returns usage metrics by feature or area. Agent factors it into triangulation: e.g. "CSV export requested in Canny + low usage of current export path + high support tickets on export" → stronger signal. Surfaces "nobody uses X" or "everyone abandons at step Y" as evidence. |
| **Incidents / reliability** | Outages, errors, P0s tied to a feature or service. | Ingest from Pagerduty, Sentry, or internal incident system. "Export fails for workspaces > 100 users" + Canny requests for export → spec calls out scale/reliability in acceptance criteria. |
| **NPS / CSAT or segment feedback** | Structured feedback by segment (e.g. by plan, role, account). | Survey or CRM data; agent uses it to weight or attribute (e.g. "Enterprise segment consistently asks for X"). Complements Gong/Canny/Zendesk. |
| **Internal eng pain** | "Hard to maintain," "tech debt," "we keep fixing the same bug." | Source: Linear labels, retros, or a simple "pain" board. Agent can triage: customer-facing vs internal; or "customer asked for X and eng has flagged X as brittle" → higher priority. |

**For the demo:** You can say we chose three signals (Gong, Canny, Zendesk) for scope and because they're universal in enterprises; the same pipeline could ingest backlog, usage, and incidents as additional inputs so prioritization is even closer to how real teams work.

### Other workflow parts and signals the same method could improve (Q&A / evolution)

The same pattern — **ingest signal → turn into spec (with rules) → plan → build → verify → PR** — applies to other parts of the engineering workflow. Each one improves speed by compressing the handoff from "something happened" or "we need X" to shipped code.

| Workflow part / signal | What gets ingested | Speed improvement |
|------------------------|-------------------|-------------------|
| **Incident → fix** | Pagerduty/Sentry ticket, stack trace, logs. | Incident → spec for fix (root cause + acceptance criteria) → code change + test. Faster from "page fired" to patch. |
| **Security / compliance findings** | Scanner output (Snyk, Semgrep), audit checklist. | Findings → spec ("remediate these") → code/config changes. Audit to remediation in one flow. |
| **Design handoff** | Figma, screenshots, or design spec. | Design → acceptance criteria / spec → implementation. Design-to-code without the developer re-reading every frame. |
| **Code review feedback** | PR comments as signal. | Comments → spec (list of requested changes) → agent implements. Review to resolution without context switch. |
| **Dependency / upgrade** | Deprecation notices, CVE, "upgrade to Node 20." | Signal → migration spec (what to change, what to test) → code + tests. Dependency management faster. |
| **Documentation drift** | Diff between docs and code, or "docs outdated" ticket. | Signal → spec for doc update or code update → agent updates. Keeps docs in sync without manual pass. |
| **Retro / improvement** | Retro items, "what went wrong," eng feedback. | Items → spec for tooling/process/code improvement → implementation. Retro to actionable change. |
| **API / contract** | OpenAPI, gRPC proto, or API contract change. | Contract as spec → client code, adapter, or tests. Contract-first development in one run. |

**Unifying idea:** In every case, a **signal** (ticket, finding, design, comment, contract) is turned into a **structured spec** (rules enforce format and quality), then the **agent** plans and builds with the same architecture/test discipline. The POC demonstrates the pattern with customer voice; the pattern itself is reusable across the rest of the engineering lifecycle.

**For the demo / Q&A:** "The same method—ingest a signal, turn it into a spec with rules, then plan and build—could apply to incidents, security findings, design handoff, or PR review comments. We chose customer signal for the prototype because it's the highest-friction handoff in most orgs, but the primitives (rules, MCP, agent) are the same."

### Enterprise engineering perspective: adoption metrics and outcomes

*Use this when presenting to or anticipating questions from enterprise engineering. These problems came from conversations with that team; the demo and script can speak to each.*

| Problem (from enterprise eng) | How the demo / script addresses it |
|-------------------------------|-------------------------------------|
| **Leaders don’t have a clear, trusted way to measure “successful AI adoption”**; every enterprise uses different metrics. | This prototype defines one **repeatable unit of success**: one customer-identified pain → one shipped feature with **full traceability** (spec with Origin, code, tests, PR, Linear). Leaders can count those units (“we closed N customer gaps with AI-attributed specs this quarter”) instead of inventing custom dashboards. Same flow, same artifacts, comparable across teams. |
| **Executive dashboards** (e.g. “60.5% AI share of committed code”) are easy to misinterpret, lack benchmarks, and cause over-reaction when numbers move. | We **don’t lead with volume**. We lead with **outcome**: “This feature exists because we turned this customer’s pain into this spec and this code.” The demo shows spec → code → verify; the PR body includes an outcome line (see below). That gives executives a story (“we closed Acme Corp’s export gap”) instead of a number that moves and gets misinterpreted. |
| **No shared guidance** on what “good” looks like (normal ranges, top-quartile, cross-company comparison). | The pipeline itself is the **shared playbook**: ingest → triangulate → spec (with origin + test requirements) → build → verify → PR. “Good” = spec has multi-source attribution, acceptance criteria, tests that pass, and verification against the customer. Reusable across orgs; no one-off definitions of “good.” |
| **Metrics biased toward volume/velocity** (AI share, completions) rather than **outcomes** (code quality, fewer bugs, time saved, business impact). | The demo is **outcome-first**. Success is “we shipped a feature that closes a documented customer pain, with tests and verification.” Quality is built in (rules for tests, UI, acceptance criteria); business impact is explicit (Origin + Customer quotes in the spec, verify with product server). Use this as a talking point: “We’re not optimizing for AI share of code; we’re optimizing for customer gaps closed with traceability.” |
| **Enterprise engineering ends up owning too much** of customer-facing analytics and success-definition work, pulling them away from core engineering. | The pipeline **produces the artifacts** (specs with origin, PRs with outcome lines) so “success” is visible without EE building custom dashboards. One standard flow (signal → spec → code → PR) yields countable, auditable outcomes. EE can adopt the flow and the rules instead of maintaining one-off analytics; the **definition of success** lives in the spec and PR, not in a separate dashboard EE has to build. |

**Where to use this:** (1) In the **problem intro**, add one sentence: “We also heard that leaders lack a trusted way to measure AI adoption and that metrics skew to volume instead of outcomes; this pipeline is one way to define success by customer impact.” (2) When you **show the PR** (or describe what goes in it), say: “The PR body includes an outcome line — e.g. ‘Closes SYT-17; outcome: CSV export for Acme Corp from Gong/Canny/Zendesk.’ That’s one unit of outcome-based success, not a vanity metric.” (3) In **Q&A**, if someone asks about adoption metrics or executive dashboards, use the table above.

### Pragmatic playbook: Stripe-style lessons (metrics + design)

Stripe's internal coding agent (and similar internal platforms) reinforces design choices we already made. Use these points when discussing metrics or "how should enterprises think about agent success?"

| Stripe lesson | How our demo already does it | Line for the demo / Q&A |
|---------------|------------------------------|--------------------------|
| **North star: PRs produced without human code** (not "AI wrote X lines" or "Y% of code") | We lead with **outcome**: shippable PRs with full attribution (spec, code, tests, Linear, outcome line). We count **customer gaps closed** or **PRs from the pipeline**, not lines or AI share. | "Our north star is the same idea Stripe talks about: **PRs produced without human-written code** — actual shippable output. We don't measure 'AI wrote X lines'; we measure 'we closed this customer gap and opened a PR with tests and traceability.' Better proxy for real productivity." |
| **Vibe coding ≠ production** — contributing to a real codebase is different from prototyping from scratch | We use a **real starter codebase** (AnalyticsService, routes, components), **rules** (architecture, spec template, test requirements), and **verification** (product server, `npm test`). We're not vibe coding from zero; we're adding a feature to an existing system with constraints. | "We're not prototyping from scratch. The agent is contributing to an existing codebase with rules that enforce architecture, tests, and UI visibility. Vibe coding and production contribution are different — we're aligned with the latter." |
| **Tooling is the unlock** — MCP/plugins make agents useful vs impressive demos | We use **MCPs** for Gong, Canny, Zendesk, Product, Linear. The agent can actually pull signal, create tickets, verify against customer tier. Without those tools, we'd have an impressive demo; with them, we have a runnable pipeline. | "Stripe has hundreds of internal tools; we have a small set of MCPs that let the agent do real work — pull customer signal, create Linear issues, verify features. Tooling is what turns a demo into something that ships." |
| **Humans in the loop** — agents parallelize grunt work, don't replace devs | **Plan approval** before implementation (unless yolo); **PR review** by human. The agent does ingest → spec → plan → implement; the human approves the plan and reviews the PR. | "Humans stay in the loop. We approve the plan before the agent writes code, and we review the PR. The agent is parallelizing the handoff from signal to spec to code so we can focus on review and the hard problems." |

**Pragmatic playbook (one line):** Powerful models + quality tooling (MCPs, rules) + realistic expectations (humans in the loop, outcome not volume). Our demo is aligned with that.

**When to use:** When someone asks "how do you measure success?" or "how is this different from just having the AI write code?" — lead with "PRs without human code" / outcome, then tie to Stripe if they know the reference. When discussing design, reinforce "vibe ≠ production" and "tooling is the unlock."

### What the hiring committee is evaluating

- **Strong problem selection and scoping:** We chose “customer signal → spec → code with attribution,” a well-defined slice of the dev workflow, and scoped to ingest → triangulate → spec → build → verify → PR. We did not try to automate the entire SDLC.
- **Product and technical judgment:** Rules encode product decisions (e.g. UI must be in spec when user-facing; tests required per feature; visibility/enablement explicit). Technical choices (Zod, vitest, supertest, MCP contracts) are consistent and documented.
- **Clear articulation of enterprise value:** Problem and three-benefits tables above; **ROI via pain-to-AI traceability** (this customer pain → this spec → this code); PR and stakeholder routing in the spec; customer verification step.
- **Thoughtfulness around edge cases and risks:** Spec template requires test requirements and UI visibility so we don’t ship half-features. Architecture rule requires tests and `npm test` before done. Limitations and evolution are called out above.
- **Clarity and confidence:** This script plus the step-by-step below give a clear path through the 30-minute demo; use “Design decisions” and “Limitations” as Q&A talking points.

### Suggested 30-minute pacing

- **~5 min:** Problem and why it matters; **ROI framing** (customer pain → AI solved this); how we demonstrate the three benefits (use the table above).
- **~20 min:** Working walkthrough — Before the demo (MCPs green), then Step 1–3 (`/signal-to-spec` or ingest → triangulate → spec), then Step 4 (plan + build, or `/do-linear-ticket SYT-17`), then Step 5 (verify with product server). Show the spec (including Origin and Customer quotes), the code, the Export CSV button, and `npm test` passing. **When showing the spec and code, tie them back to the pain point** (e.g. “This requirement came from Jane’s quote; this button is the UI we promised in the spec”).
- **~5 min:** Design decisions (2–3 bullets), limitations, and how you’d evolve. Sets up Q&A.

### Demo checklist (cover every item)

Use this to confirm you’ve included everything the project prompt asks for:

- [ ] **Explain the problem** and why it matters in an enterprise context (use “Problem we chose” above).
- [ ] **Tie customer pain to AI usage** — state explicitly that AI usage solved a specific pain point and show the link (spec Origin + Customer quotes → code + UI + tests).
- [ ] **Demonstrate the three benefits** — velocity, cognitive load, quality/consistency (use the table above).
- [ ] **Walk through the working prototype** — ingest → triangulate → spec → plan → build → verify; show spec, code, tests, and (if time) PR description or Linear.
- [ ] **Discuss design decisions and tradeoffs** (use the bullets in “Design decisions and tradeoffs” above).
- [ ] **Highlight limitations and how you’d evolve** (use “Limitations and how we’d evolve” above).
- [ ] **Hit evaluation criteria** — problem selection, product/technical judgment, enterprise value, edge cases/risks, clarity (use “What the hiring committee is evaluating” above).
- [ ] **Pace to 30 minutes** using the suggested timing; leave 15 min for Q&A.
- [ ] **Optional (enterprise eng / adoption metrics):** If relevant, use “Enterprise engineering perspective: adoption metrics and outcomes” — e.g. one sentence in the problem intro, outcome line when showing the PR, or the table in Q&A when asked about dashboards or success metrics.

---

## Second run: the "rules say no" beat

**Why this matters for the demo:** The first run shows the pipeline working end-to-end (CSV export ships clean). The second run shows the pipeline **catching a real architectural concern** before any code is written. This directly demonstrates "increase code quality, safety, or consistency" from the prompt.

**Suggested pacing:** ~5 minutes. Fits after the CSV export walkthrough, before design decisions.

### Setup

After the CSV export PR, commit to the branch (or say "assume this is merged"). The spec (`specs/csv-bulk-export.md`) and export code are now in the repo.

### Run

Type `/signal-to-spec` again (or re-run the ingest prompts). The agent will:

1. **Ingest** from the same three sources (Gong, Canny, Zendesk).
2. **Triangulate** — but this time, see that CSV export already has a spec and implementation. Mark it DONE. The **next strongest signal** is **Dashboard Customization** (2 Gong calls from Stark + Beta, 31 Canny votes from 5 companies, 3 Zendesk tickets across 3 companies).
3. **Write the spec** for dashboard customization: saved views, custom widget layouts, team-specific dashboards.
4. **Hit the architecture check** — the `architecture-check` rule fires. Saved views require persisting user/team layout preferences. Our codebase is currently stateless per request — no user configuration storage exists. The agent flags:

   > `NEEDS_DESIGN_REVIEW`: Saved views require a new persistence layer. No user/workspace configuration storage exists in current architecture. The agent must not proceed to implementation until the developer acknowledges.

5. **Stop and present the flag.** The agent asks: proceed with a proposed storage approach, descope to avoid persistence, or defer to architecture review?

### The talking point

"The same pipeline that shipped CSV export in one session just caught an architectural concern on the next feature. Dashboard customization needs saved views — that's the first persistent state in this codebase, and the rules flagged it before a single line of code was written. That's the 'code quality, safety, and consistency' the prompt asks about. The system doesn't just build things — it knows when to stop and ask."

### If they ask "what would you do next?"

"Three options. One: descope — rearrange widgets in-session only, no persistence needed, ships fast. Two: add a lightweight storage layer — localStorage for MVP, backend preferences table for durability. Three: defer to an architecture review to decide the persistence strategy before building. The point is: the developer makes an informed choice instead of a silent assumption that creates tech debt."

### Why this beat matters for the evaluation

| Evaluation criterion | How the second run demonstrates it |
|---------------------|-------------------------------------|
| **Code quality, safety, consistency** | Rules catch a real architectural concern before code is written |
| **Product and technical judgment** | The system distinguishes stateless features (export) from stateful ones (saved views) |
| **Thoughtfulness around edge cases** | The agent flags the first persistent state as a deliberate decision, not an implicit one |
| **Enterprise value** | In an enterprise codebase, silent introduction of state management is exactly the kind of thing that causes outages and tech debt |

---

## Product development lifecycle (what comes next)

After **implementation** (code + UI + tests), the pipeline continues:

1. **Verify** — Use the Product Server MCP (`lookup_customer`, `verify_feature_compatibility`) to confirm the feature works for the customer(s) from the spec (e.g. Acme Corp tier/config). See Step 5 below.
2. **PR** — Open a pull request; description should reference the spec in `specs/`, signal origin (Gong/Canny/Zendesk), stakeholder @mentions, and a one-line **outcome** (e.g. “Outcome: CSV export for Acme Corp from Gong/Canny/Zendesk”) so the PR is an outcome-based success artifact. Use `/open-pr` or the PR step in `/signal-to-pr`.
3. **Review** — Human review of spec, code, and tests. Move the Linear issue to "In Review" or "Done" when merged.
4. **Merge & deploy** — Per your team’s process (CI/CD, preview envs). Out of scope for the demo unless you’ve wired it.

**Tests** are part of implementation: every feature must include unit and/or integration tests that map to the spec’s acceptance criteria (see `.cursor/rules/architecture.mdc` and the spec template’s "Test Requirements" section). Run `npm test` before considering the feature done.

---

## Standard command: steps 1–3 in one go

**Type `/signal-to-spec`** in the Agent chat (Cmd+L). That runs a custom Cursor command that does **Ingest → Triangulate → Spec** in a single flow: the agent pulls from Gong, Canny, and Zendesk, builds the cross-source table, picks the top feature, and writes the spec to `specs/`. No need to paste the three prompts below unless you want to run them step by step.

The command is defined in **`.cursor/commands/signal-to-spec.md`**. It is intentionally topic-agnostic: the agent discovers the top feature from the data, not from the prompt.

---

## Setting up the live demo branch

For the live demo, you want a starting point that has all the **infrastructure** (rules, commands, MCPs, mock data, dashboard UI) but **not** the export implementation. The agent builds the export feature live. If something goes wrong, `main` has the fully working version as a fallback.

### One-time setup (after committing everything to `main`)

```bash
# Start from main with everything committed
git checkout main

# Create the demo branch
git checkout -b demo/live

# Remove the export implementation files (keep everything else)
git rm src/services/export-service.ts
git rm src/api/routes/export.ts
git rm src/__tests__/export-service.test.ts
git rm src/__tests__/export-route.test.ts
git rm src/__tests__/smoke-export.test.ts
git rm specs/csv-bulk-export.md
```

Then revert `src/app.ts` and `src/server.ts` to not reference the export route:

```bash
# Revert app.ts to not import export routes
# (edit src/app.ts to remove the export route import and usage)
# Revert the Export CSV button from AnalyticsDashboard.tsx
# (the agent will add it during the live build)
```

Commit as the "clean starting point":

```bash
git commit -m "demo: clean starting point for live build (no export implementation)"
```

### Before each demo run

```bash
git checkout demo/live
git reset --hard demo/live  # reset any previous demo artifacts
```

### Fallback

If the live build stalls or breaks, switch to `main`:

```bash
git stash  # or git checkout .
git checkout main
npm test   # confirm everything works
```

Then continue the demo from the working state on `main`, saying "here's what the finished implementation looks like."

---

## Before the demo

1. **Install MCP server dependencies** (once per machine):
   ```bash
   cd mcp-servers/gong-mock && npm install && cd ../..
   cd mcp-servers/canny-mock && npm install && cd ../..
   cd mcp-servers/zendesk-mock && npm install && cd ../..
   cd mcp-servers/product-mock && npm install && cd ../..
   ```

2. **Confirm Cursor sees the MCPs**  
   Open **Cursor Settings → MCP**. You should see `gong-mock`, `canny-mock`, `zendesk-mock`, `product-server-mock` with green status. If not, restart Cursor with this project open (`.cursor/mcp.json` is in the repo root).

3. **Optional but helpful:** Add the pipeline rules so the agent triangulates and formats specs consistently. From the PRD, create (or copy) into `.cursor/rules/`: `signal-analysis.mdc`, `spec-template.mdc`. If you skip rules, the agent will still call the MCPs and produce a spec; the output may be less structured.

4. **Optional — Linear metrics:** In your Linear workspace (or team), create two labels: **`Cursor-sourced`** and **`Cursor-built`** (Settings → Labels). The pipeline will tag issues so you can filter/report on “issues sourced by Cursor” and “issues built by Cursor.” See [DESIGN_NOTES.md](DESIGN_NOTES.md) for details.

---

## Troubleshooting: “MCP tools were not available in this session”

If the agent creates a spec but says it used mock data from the `mcp-servers/` files instead of calling the Gong/Canny/Zendesk tools, the MCP servers weren’t connected for that chat. Fix it so the next run uses the real tools:

1. **Open this repo as the workspace root**  
   Use **File → Open Folder** and select the `cursor-sales-project` folder (the one that contains `.cursor/` and `mcp-servers/`). Project-level `.cursor/mcp.json` is only used when this folder is the root.

2. **Check MCP status**  
   Go to **Cursor Settings → MCP** (or **Settings → Cursor Settings → MCP**). You should see `gong-mock`, `canny-mock`, `zendesk-mock`, `product-server-mock`. If they’re red or missing, continue below.

3. **Restart Cursor (or reload the window)**  
   After adding or changing `.cursor/mcp.json`, fully quit Cursor and reopen this project, or use **Developer: Reload Window** from the Command Palette (Cmd+Shift+P). Then check Settings → MCP again.

4. **Confirm MCP server deps are installed**  
   From the repo root run:  
   `for d in mcp-servers/*/; do (cd "$d" && npm install); done`  
   Each server needs its own `node_modules` (and a working `node` on your PATH).

5. **If servers still don’t connect, try absolute paths**  
   Edit `.cursor/mcp.json` and replace the relative `./mcp-servers/...` paths with the full path to your repo, e.g.  
   `"/Users/you/cursor-sales-project/mcp-servers/gong-mock/index.js"`  
   (Use your actual path.) Save, reload the window, and check MCP status again.

6. **Start a new Agent chat**  
   After the MCPs show green, start a **new** Agent conversation (Cmd+L, new chat) and run `/signal-to-spec` again. The new session will have access to the tools.

When the MCPs are connected, the agent will call `search_calls`, `get_transcript`, `search_feature_requests`, `search_tickets`, etc., instead of reading the mock JS files.

---

## Step 1: Pull signal (INGEST)

*(Or use `/signal-to-spec` to run steps 1–3 in one command.)*

Open **Agent (Cmd+L)** and paste:

```
Pull recent customer signal from all three sources:
1. Use the Gong tools to search for recent calls (last two weeks) and get transcripts for the 2–3 most relevant ones. Summarize participants, key quotes, and topics raised.
2. Use the Canny tools to list feature requests sorted by votes. Note the top requests, scores, and voter companies.
3. Use the Zendesk tools to search for recent open/pending tickets. Note recurring themes and which companies are filing them.

Summarize what you found from each source in one short report. What themes emerge?
```

**What should happen:** The agent pulls broadly from all three sources with no topic hint. It naturally discovers that **CSV export** is the dominant theme: Acme Corp's pain on Gong, the highest-voted Canny request, and a cluster of Zendesk tickets. The agent surfaces this without being told to look for it.

---

## Step 2: Triangulate and pick the top signal

Follow up with:

```
Looking at that signal across all three sources (Gong, Canny, Zendesk), which feature request is strongest? Create a small table: feature name, Gong mentions, Canny votes, Zendesk tickets, and a strength rating (Critical / High / Medium). Then in 2–3 sentences, say why that’s the top priority and cite evidence from each source (e.g. “Acme Corp said X on the call; Canny has Y upvotes; Zendesk has Z tickets about…”).
```

**What should happen:** The agent produces a cross-source view and names **CSV bulk export** as the top signal, with quotes and numbers from each channel.

---

## Step 3: Generate a feature spec

```
Using the top-priority feature (CSV bulk export), write a short feature spec and save it to specs/csv-bulk-export.md. Include:
- Origin: which Gong call(s), Canny request(s), and Zendesk ticket(s) drove this, plus signal strength.
- Problem statement (1–2 sentences).
- 3–5 requirements (bullet list).
- 3–5 acceptance criteria (checkboxes).
- Technical note: must integrate with our existing AnalyticsService in src/services/analytics-service.ts and our analytics API in src/api/routes/analytics.ts.
```

**What should happen:** The agent creates `specs/csv-bulk-export.md` with multi-source attribution and constraints that point at your real codebase.

---

## Step 4: Plan and build the feature

```
Read specs/csv-bulk-export.md. Then:

1. In Plan Mode (or as a numbered plan in chat), list the exact files and changes you would add: a new export service or module, API route(s), and a way to trigger export from the existing analytics dashboard UI in src/components/AnalyticsDashboard.tsx. Keep using our stack: Vite + React frontend, Express API, TypeScript, Zod for validation.

2. After I approve, implement it: add the export API and any new service, and add an “Export CSV” (or similar) control to the analytics dashboard that uses the existing date range and metrics. Write tests under src/__tests__/ for the new logic. Follow the patterns already in the repo.
```

**What should happen:** The agent proposes a plan (e.g. `src/services/export-service.ts`, `src/api/routes/export.ts`, changes to `AnalyticsDashboard.tsx`, tests). After you approve, it implements and wires CSV export to the existing UI and API.

---

## Step 5: Verify with “product server” (customer check)

```
Use the product server MCP to look up the customer jane@acmecorp.com (from the Gong call). Then verify that the CSV export feature we just built is compatible with that customer’s tier and configuration. Summarize the result in 1–2 sentences and suggest what to put in the PR description (e.g. “Verified for Acme Corp Enterprise”).
```

**What should happen:** The agent calls `lookup_customer` and `verify_feature_compatibility`, then returns a short verification note and a PR blurb.

---

## Step 5b: Run tests (quality gate)

After the build, run the full test suite:

```
Run npm test and show me the results.
```

**What should happen:** The agent runs `npx vitest run` and all 30 tests pass across 4 test files:
- `analytics-service.test.ts` (4 tests) — core analytics service
- `export-service.test.ts` (12 tests) — CSV generation + validation edge cases (invalid dates, range > 90 days, unknown metrics, end-before-start)
- `export-route.test.ts` (10 tests) — API route integration tests via supertest (happy path + structured 400 errors)
- `smoke-export.test.ts` (4 tests) — full HTTP smoke test: starts the Express app on a random port, hits `POST /api/export` with `fetch()`, verifies CSV and error responses over real HTTP

**The talking point:** "30 tests, 4 files. The smoke test starts the real server and makes actual HTTP calls — it's not just mocking. The edge case tests validate that the API returns structured error codes (`RANGE_TOO_LARGE`, `UNKNOWN_METRICS`, `END_BEFORE_START`) — not stack traces. That's the kind of thing that matters in production."

**If they ask about the edge cases:** "The spec said 'export for a date range.' But what if someone requests a year of data? What if the dates are garbage? What if they inject a metric name that doesn't exist? The export service validates all of that before it touches the analytics layer, and the API returns structured JSON errors with codes that a frontend or API consumer can handle programmatically."

---

## Step 5c: Review the PR (architecture + security checks)

After tests pass, run the review command:

**Type `/review-pr`**

**What should happen:** The agent reads the diff, then runs four checks against the project rules:

1. **Architecture gates** — checks for new persistence layers, auth patterns, interface changes, and input-driven output risks. CSV export should pass all gates (stateless, no new auth, no breaking changes, and filename is sanitized).
2. **Security review** — checks input validation (Zod), injection risk (filename sanitization), CSV injection (metric allowlist), and sensitive data leakage.
3. **Quality & consistency** — test coverage, error handling, domain language, naming conventions.
4. **Summary** — one-line verdict (ship it / ship with notes / block and fix).

**The talking point:** "This is the same command any developer on the team would run. It checks the diff against the architecture rules and security gates we defined. For CSV export it should pass clean — the dates are sanitized in the filename, metrics are allowlisted, errors are structured. But when we run the second feature (dashboard customization), the same review would flag the persistence concern. Same command, different outcomes based on the actual risk."

**Why this matters for the prompt:** The prompt lists "automated PR review assistant (e.g., policy, security, or architecture checks)" as an example problem space. This command directly hits that — and it's integrated into the same pipeline, not a separate tool.

---

## Step 6 (optional): Draft the PR description

```
Draft a PR description for the CSV bulk export feature. Include:
- Signal origin (Gong call, Canny request, Zendesk tickets).
- Link to specs/csv-bulk-export.md.
- List of files changed.
- The customer verification line for Acme Corp.
- A short “AI attribution” line (e.g. spec and code generated from multi-source signal via Cursor).
```

**What should happen:** You get a PR body you can paste into GitHub (or use later with the GitHub MCP when you add it).

---

## Linear: create a ticket from the spec

Linear has an **official remote MCP** (no local server). You can create a Linear issue from a spec so the feature is tracked in your backlog.

### Adding the Linear MCP

1. **Option A — Cursor one-click (recommended)**  
   Open: [Linear MCP install for Cursor](https://linear.app/docs/mcp) and use the **“install by clicking here”** link, or go to **Cursor Settings → MCP** and search for **Linear** in the MCP directory. That will add the server and start the **OAuth sign-in** to your Linear account.

2. **Option B — Project config**  
   This repo’s `.cursor/mcp.json` already includes Linear:
   ```json
   "linear": {
     "command": "npx",
     "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
   }
   ```
   Reload the window (Cmd+Shift+P → “Developer: Reload Window”). The first time you use Linear in an Agent chat, Cursor may prompt you to **sign in to Linear** (OAuth in the browser). Do that once; afterward the tools should work.

If Linear doesn’t appear in **Settings → MCP**, install the `mcp-remote` bridge: `npx -y mcp-remote https://mcp.linear.app/mcp` runs the remote server over stdio so Cursor can talk to it. After auth, you’ll see tools like creating/updating issues, listing projects, etc.

### Create a ticket from a spec

After running `/signal-to-spec` (or writing a spec by hand), open a **new Agent chat** and run:

**`/spec-to-linear`**

That command is defined in `.cursor/commands/spec-to-linear.md`. The agent will read the spec (e.g. `specs/csv-bulk-export.md`), then use the Linear MCP to create an issue with the feature name, origin, problem statement, and requirements. New issues get the label **`Cursor-sourced`** (create that label in Linear for pipeline metrics). You can then say “put it in project X” or “add label Y” if needed.

Or ask in plain language: *“Create a Linear issue from specs/csv-bulk-export.md and set the project to [your project].”*

### Do a specific Linear ticket (plan + implement)

After a feature is in Linear, you can implement it from the ticket in one go.

**Command:** **`/do-linear-ticket`** — then in the same or next message give the **issue id** (e.g. `SYT-17`) or the **full issue URL**.

Example: type `/do-linear-ticket` and then `SYT-17`, or paste the Linear issue URL.

The agent fetches the issue from Linear, finds the spec (from the issue or a matching file in `specs/`), writes a short plan, and after you approve implements (services, routes, components, tests). When done, the issue is tagged **`Cursor-built`** for metrics (create that label in Linear if you want). Command: `.cursor/commands/do-linear-ticket.md`.

**Then open a PR:** Run **`/open-pr`** (optionally with the Linear issue id, e.g. SYT-17) to stage, commit, push, and `gh pr create --fill`. Command: `.cursor/commands/open-pr.md`.

### Full pipeline to PR (yolo)

To run **signal → spec → Linear → implement → open PR** in one go:

**Command:** **`/signal-to-pr`**

- The agent runs steps 1–3 (ingest, triangulate, spec), then creates/finds the Linear issue, then plans. By default it **asks for approval** before implementing.
- To skip the approval step, say **"yolo"**, **"no approval"**, or **"just do it"** in the same message (e.g. `/signal-to-pr yolo`). The agent will implement and then open a PR.
- **PR step:** Requires **GitHub CLI** (`gh`) installed and authenticated. The agent will `git add`, commit, push, and run `gh pr create --fill`, referencing the Linear issue in the PR title/body.
- Use the **modular** commands when you want to pause at spec, Linear, or plan; use **this** when you want one continuous run to a PR.

Command: `.cursor/commands/signal-to-pr.md`.

---

## Hooks: automated quality gates

Two hooks fire automatically during the demo — no user action needed:

### Hook 1: Auto-run tests on agent stop (`stop`)

When the agent finishes its work, the `stop` hook runs `npm test` automatically. If any tests fail, it returns a `followup_message` that auto-submits to the agent: "Tests failed. Fix the failing tests." The agent then self-heals — reads the failures, fixes the code, and the hook runs again on the next stop.

**During the demo:** After the agent finishes building the export feature, tests run without you typing anything. 30/30 pass → the agent is done. If the agent had introduced a bug (say, forgot the 90-day range validation), the tests would catch it and the agent would auto-fix. Maximum 2 retry loops.

**The talking point:** "I didn't run the tests — the hook did. And if they'd failed, the agent would have automatically tried to fix them. That's a self-healing quality gate: hooks enforce it, rules define it, tests verify it."

### Hook 2: Security scan on route edits (`afterFileEdit`)

Every time the agent writes or modifies a file in `src/api/routes/`, the security-scan hook fires and checks for:
- User input in `Content-Disposition` headers without sanitization
- Template literals using `req.body` directly in HTTP headers
- Async handlers without try/catch (crash risk)
- Raw error objects in responses (stack trace leakage)
- Missing Zod/schema validation on `req.body`

**During the demo:** When the agent creates `src/api/routes/export.ts`, the hook runs silently. If the agent had skipped input sanitization, the hook would flag it immediately — before the code even compiles.

**The talking point:** "The security scan runs on every route edit, not just when someone remembers to run a linter. It's checking OWASP Top 10 patterns — path traversal in filenames, stack trace leakage, missing input validation. That's the 'increase code quality, safety, or consistency' the prompt asks about."

### Configuration

Hooks are defined in `.cursor/hooks.json` (project-level, committed to the repo):

```json
{
  "version": 1,
  "hooks": {
    "stop": [{ "command": ".cursor/hooks/run-tests-on-stop.sh", "timeout": 60 }],
    "afterFileEdit": [{ "command": ".cursor/hooks/security-scan-route.sh", "timeout": 10 }]
  }
}
```

Scripts live in `.cursor/hooks/` and are executable shell scripts. They receive JSON on stdin and return JSON on stdout. The `stop` hook's `followup_message` field is what enables the self-healing loop.

### Why hooks matter for the evaluation

Hooks are the **fourth Cursor extensibility primitive** alongside Rules, Commands, and MCPs:

| Primitive | What it does | When it fires |
|-----------|-------------|---------------|
| **Rules** | Tell the agent *what* to enforce | When the agent reads relevant files |
| **Commands** | Tell the agent *how* to run a workflow | When the user types a slash command |
| **MCPs** | Give the agent *tools* to interact with external systems | When the agent needs data or actions |
| **Hooks** | Enforce quality gates *automatically* | At specific points in the agent lifecycle |

"Rules define the standard. Commands run the pipeline. MCPs connect the tools. Hooks enforce it all automatically — even if the developer forgets to ask."

---

## Quick reference: MCP tools

| Server          | Tools                                                                 | Real API modeled |
|-----------------|-----------------------------------------------------------------------|------------------|
| **gong-mock**   | `search_calls`, `get_transcript`, `get_call_participants`             | Gong API v2 (`GET /v2/calls`, `POST /v2/calls/transcript`) — Party objects with `speakerId`, `affiliation`, `emailAddress`; transcript monologues with ms-offset sentences; standard `{ requestId, records, calls }` envelope |
| **canny-mock**  | `search_feature_requests`, `get_request_details`, `get_request_voters`| Canny API v1 (`POST /api/v1/posts/list`, `/posts/retrieve`, `/votes/list`) — Post objects with `score`, `details`, `tags` (objects), `board`, `category`, `author` (User); Vote objects with full `voter` User and `companies` |
| **zendesk-mock**| `search_tickets`, `get_ticket_details`, `get_ticket_comments`         | Zendesk Support API v2 (`GET /api/v2/search.json`, `/tickets/{id}.json`, `/tickets/{id}/comments.json`) — integer IDs, snake_case fields, `via` object, `result_type`, `html_body`/`plain_body` on comments; `{ results, count, next_page }` envelope |
| **product-server-mock** | `lookup_customer`, `verify_feature_compatibility`              | Internal (custom) — tier-based capability gates, feature prerequisites, config limits |
| **linear**      | Create/update issues, list projects, etc. (remote; OAuth)             | Real Linear API via official MCP |

**The talking point:** "These aren't toy mocks. Each one returns data shaped exactly like the real vendor API — same field names, same nesting, same response envelopes. Gong calls have `speakerId` and `affiliation` like the real Gong API v2. Zendesk tickets have integer IDs, `requester_id`, `organization_id`, `via` objects, and snake_case fields. Canny posts have `score` (not 'voteCount'), `details` (not 'description'), and tag/board/user objects matching their docs. When you swap in real API credentials, the agent's prompts and rules don't need a single change."

Mock data is aligned: **Acme Corp** and **CSV export** appear in Gong, Canny, and Zendesk so the agent can triangulate one clear top priority. After CSV export ships, **Dashboard Customization** is the next strongest signal (2 Gong calls, 31 Canny votes, 3 Zendesk tickets) — and it triggers the architecture check.

## Quick reference: Slash commands

| Command | What it does |
|---------|-------------|
| `/signal-triangulate` | Ingest + triangulate only (prioritization, no spec). Use for quick prioritization or step-by-step demo. |
| `/signal-to-spec` | Steps 1–3: ingest from Gong/Canny/Zendesk, triangulate, write spec |
| `/spec-to-linear` | Create a Linear issue from an existing spec |
| `/do-linear-ticket` | Fetch a Linear issue, find the spec, plan + implement |
| `/open-pr` | Stage, commit, push, `gh pr create` with outcome line |
| `/signal-to-pr` | Full pipeline: signal → spec → Linear → build → PR |
| `/review-pr` | Architecture + security + quality review on the current diff |

---

## Plugin: enterprise distribution

Everything in this prototype — rules, commands, hooks, and MCP configs — is packaged as a **Cursor plugin** (`.cursor-plugin/plugin.json`). An enterprise team installs it once, and every developer gets the full signal-to-code pipeline.

```
signal-to-code/
├── .cursor-plugin/plugin.json   # Plugin manifest
├── .cursor/rules/               # 8 rules (architecture, security, spec template...)
├── .cursor/commands/            # 7 commands (/signal-triangulate, /signal-to-spec, /review-pr...)
├── .cursor/hooks.json           # 2 hooks (auto-test, security scan)
├── .cursor/mcp.json             # 6 MCP servers (Gong, Canny mock+live, Zendesk, Product, Linear)
└── mcp-servers/                 # Mock server implementations
```

**The talking point:** "Everything you just saw — the rules, commands, hooks, and MCP connections — is packaged as a Cursor plugin. An enterprise team installs it once. New hire on day one? They install the plugin and they have the same signal-to-code workflow as everyone else. Swap the mock MCP servers for real Gong/Canny/Zendesk APIs and it's production-ready. That's the enterprise distribution story."

**Why this matters:** The prompt asks about "meaningful value to an enterprise organization shipping production software." A plugin isn't just a demo — it's a distributable product. Enterprise teams can version it, review it, and roll it out across hundreds of developers. Platform and security teams can audit the hooks and rules before approval. That's how tooling actually ships in enterprises.

**Five Cursor primitives in one plugin:**

| Primitive | Count | What it does |
|-----------|-------|-------------|
| **Rules** | 8 | Define what to enforce (architecture, security, spec format, domain language) |
| **Commands** | 7 | Define how to run workflows (signal-triangulate, signal-to-spec, review-pr, open-pr...) |
| **MCPs** | 6 | Connect to external systems (Gong, Canny mock, Canny live, Zendesk, Product Server, Linear) |
| **Hooks** | 2 | Enforce quality gates automatically (auto-test on stop, security scan on edit) |
| **Plugin** | 1 | Package and distribute all of the above to every developer on the team |

---

## Live swap: mock → real Canny API

**Why this beat matters:** The entire demo runs on mocks. This beat *proves* the "config-only swap" claim by switching one MCP from mock to live — in front of the audience.

### Setup (before the demo)

1. **Canny account:** Create a board called "Feature Requests" and add 5–6 posts matching the mock data:
   - "Bulk CSV export from analytics dashboard" (~47 votes)
   - "Dashboard customization and saved views" (~31 votes)
   - "Azure AD / SAML SSO support" (~23 votes)
   - "Scheduled / automated CSV export via API" (~18 votes)
   - "Faster queries for 90+ day date ranges" (~14 votes)

2. **API key:** Set `CANNY_API_KEY` in your environment (shell profile, `.env` at repo root, or export before launching Cursor). The key is read from the env var — never hardcoded, never committed.

3. **Install deps** (once):
   ```bash
   cd mcp-servers/canny-live && npm install && cd ../..
   ```

### During the demo

After the full pipeline runs with all mocks, say:

> "Everything you just saw used mock data. Let me prove the swap is real."

1. Open `.cursor/mcp.json` in the editor (it's already on screen or one click away).
2. Set `canny-mock` to `"disabled": true` and `canny-live` to `"disabled": false` (or remove the `disabled` line). This is a two-line edit.
3. Reload the window (Cmd+Shift+P → "Developer: Reload Window") or restart the MCP servers.
4. Open a **new Agent chat** and run `/signal-to-spec` again (or just the Canny step: "Search Canny for feature requests about export").

**What should happen:** The agent calls `search_feature_requests` — but this time it hits the real Canny API. Real posts, real vote counts, real user data come back in the exact same schema. The triangulation still works alongside the Gong/Zendesk mocks.

### The talking point

"I just swapped one line in the MCP config — from the mock server to the live Canny API. Same tool name, same response schema, same agent behavior. The rules, commands, and prompts didn't change. That's what 'production-ready swap' looks like: it's a config change, not a rewrite."

### Fallback

If the network is slow or the API has issues, swap back to `canny-mock` in 10 seconds. Say: "Same schema, same pipeline — just a different data source. That's also the point: the agent doesn't care which backend serves the data."

### Files

| File | Purpose |
|------|---------|
| `mcp-servers/canny-live/index.js` | Real Canny MCP server (~100 lines). Same 3 tools as mock. Calls `https://canny.io/api/v1/` with your API key. |
| `mcp-servers/canny-live/.env.example` | Documents required env var |
| `.cursor/mcp.json` | Both `canny-mock` and `canny-live` entries; toggle `disabled` to swap |

---

## Design notes (commands vs prompts, Linear duplicates)

See **[docs/DESIGN_NOTES.md](DESIGN_NOTES.md)** for:

- When to use **slash commands** vs **free-form prompts**
- **Linear:** checking for duplicates before creating an issue, and **commenting on existing backlog issues** with spec context + optional PM assignee instead of creating a new ticket
- Other gotchas (new chat after MCP changes, spec path, PM assignment)
