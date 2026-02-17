# Talk track: Signal-to-Code

Use this as your spoken overview when presenting the demo. Adjust for audience and time; the sections map to DEMO_SCRIPT and slides-workflow-extensions.

---

## 1. Opener (30–60 sec)

**Real-world software development isn’t just writing code — it’s responding to customer feedback.** As AI makes code abundant, the bottleneck shifts from "engineering hours" to "sequencing and release." The hardest problem becomes deciding *what* to build.

That feedback is already there: in Zendesk tickets, in Canny votes, on Gong calls. But it lives in three different systems. By the time a developer sees a Jira ticket, the customer’s words have been translated three times and the evidence is gone.

**We built a prototype that pulls that signal into one place and turns it into a spec and code with full attribution.** Same workflow you already have — ingest, triangulate, spec, build, verify, PR — but the handoff from “what the customer said” to “what we shipped” happens inside Cursor, with traceability all the way back.

---

## 2. Problem and why it matters (1–2 min)

**The problem for Customers:** Enterprise teams lose customer signal. A feature request shows up as words on a Gong call, a vote on Canny, and a pattern in Zendesk — but those live in separate tools. Prioritization becomes guesswork.

**The problem for Engineering Leaders (NVIDIA, Adobe, Stripe):** "Lines of Code" is a vanity metric. "AI Acceptance Rate" is interesting but doesn't measure value. Leaders need a metric that matters.

**Stripe's North Star:** Stripe measures "PRs created without human code." We take that one step further: **PRs created that solve specific customer pain.** That is the trifecta: Velocity (PRs), Quality (No human code), and Value (Customer Pain Solved).

---

## 3. What we built — the flow (2–3 min)

**High level:** Ingest from three sources → triangulate to one top feature → write a spec with origin and requirements → plan → implement → verify against the customer’s tier → open a PR. All from Cursor.

And lastly, it can be packaged as a Plugin so an org can install it, or it can be launched across Orgs on the marketplace.

**Step by step:**

1. **Ingest.** The agent pulls from Gong (calls in a configurable window — default two weeks, you can say “last week” or “last month”), Canny (top feature requests by votes), and Zendesk (recent tickets). It summarizes per source: themes, key voices, voter companies. So we’re not dumping raw volume — we summarize, then triangulate.

2. **Triangulate.** We don’t let the loudest voice win. We weight by *who* said it (role: VP/CTO vs IC, from Gong), *customer status* (existing customer vs prospect, tier from the product server), and *deal potential* (tier, seats, Canny company value). So a VP at an Enterprise customer counts more than a single loud prospect. The agent builds a cross-source table and picks the strongest feature with that weighting.

3. **Spec.** The agent writes a spec in `specs/` with origin (which Gong call, Canny request, Zendesk ticket), problem statement, customer quotes, requirements, acceptance criteria, test requirements, and UI. Rules enforce the format — so we don’t ship without tests or forget the UI.

4. **Build.** From the spec we create or find a Linear issue, plan the implementation, and the agent builds it: API, service, UI, tests. You approve the plan (or say “yolo” and skip approval). Architecture and test rules are enforced.

5. **Verify.** We check the feature against the customer’s tier (product server) so we don’t promise something their plan doesn’t support.

6. **PR.** We open a PR with an outcome line — e.g. “Closes SYT-17; outcome: CSV export for Acme Corp from Gong/Canny/Zendesk.” So the PR is an outcome artifact, not just a code change.

**One line:** Signal to spec in one command; spec to Linear to implementation in two more; same feature from signal to PR in one session.

---

## 3b. Safety & Governance (The "Rules Say No" Moment) (1 min)

**Speed is dangerous if you break the architecture.** The prompt asks for "code quality, safety, and consistency." We don't just ship code; we enforce standards.

**The second run:** Watch what happens when I ask for "Dashboard Customization." The agent detects this requires saving user preferences—a new persistence layer. Our `architecture-check` rule catches this *before* a single line of code is written and flags it for review. It stops and asks: "Do you want to introduce state?"

**Invisible guardrails (Hooks):** I didn't run the tests or the security scan manually. **Hooks** did that automatically. `afterFileEdit` scans every route for security risks; `stop` runs tests and auto-heals if they fail. It's velocity *with* guardrails.

---

## 4. ROI and the three benefits (1–2 min)

**ROI:** We tie *this* customer pain to *this* AI usage. Example: “My analysts are screenshotting charts and manually copying numbers — we need CSV export for the board or we may have to evaluate alternatives.” That’s on a Gong call, plus 47 Canny votes and 5 Zendesk tickets. The agent triangulates to CSV export, writes the spec with that quote and that origin, and builds it. So we can say: *this feature exists because we turned this customer’s pain into this spec and this code.* When you walk the spec and the code, you point to the Origin and Customer quotes — that’s how you show ROI in terms of customer impact, not “AI wrote some code.”

**Three benefits (from the prompt):**

- **Velocity** — One flow replaces Gong → CRM → Jira → sprint → code → PR. Same feature from signal to reviewed PR in one session.
- **Cognitive load** — Developer stays in Cursor. No context-switching to Gong, Canny, Zendesk, or Jira. The agent pulls, triangulates, and produces one spec.
- **Quality and consistency** — Rules enforce architecture, tests, acceptance criteria, UI visibility. Every feature has tests that map to the spec. We run lint, typecheck, build, and test in CI.

---

## 5. Design decisions (1 min)

- **Three sources, not one.** Triangulation avoids over-weighting a single loud voice. We accept more MCPs and rules for higher-confidence prioritization.
- **Prioritization isn’t “loudest wins.”** We weight by role, customer status, and deal potential. So we don’t just count votes — we weight by who said it and whether they’re an existing customer.
- **Configurable signal window.** Default two weeks; startups might say “last week,” enterprises “last month.” You say it in the same message as the command.
- **Rules plus commands.** Rules define *what* must be in specs and code; commands define *how* the agent runs the workflow. Tradeoff: some duplication; benefit is consistency and a versioned, reviewable flow.
- **Mock MCPs, real API shapes.** We use mocks so the demo runs without real API keys, but the responses match real Gong, Canny, Zendesk schemas. Swap in real credentials and the agent’s behavior doesn’t change.

---

## 6. Same method, more of the workflow (1–2 min) — from slides

**The pattern is the multiplier.** We’re not just building “a customer-signal tool.” We’re showing that **one pattern** — ingest signal → structured spec (rules) → plan → build → verify → PR — applies wherever there’s a high-friction handoff from “something happened” or “we need X” to shipped code. Same primitives: rules, MCP, agent. Different signals.

**Where else it could apply:**

- **Incident → fix** — Pagerduty/Sentry → spec for fix → code + test. Page to patch.
- **Security / compliance** — Snyk, Semgrep, audit checklist → spec → remediation.
- **Design handoff** — Figma, screenshots → acceptance criteria → implementation.
- **Code review** — PR comments → spec of requested changes → agent implements.
- **Dependency / upgrade** — Deprecation, CVE → migration spec → code + tests.
- **Docs drift** — Docs vs code ticket → spec → update.
- **Retro** — Retro items → spec → implementation.
- **API / contract** — OpenAPI, contract change → client code, adapter, tests.

**Why that matters:** Enterprise doesn’t want a different tool for customer feedback, security, postmortems, and design. They want one orchestration layer that runs the same disciplined flow for each. “We use Cursor for customer-signal-to-code *and* incident-to-fix *and* audit-to-remediation” is a stickier story than “we use Cursor for customer signal.” We chose customer pain for the POC because it’s the highest-friction handoff; the same method applies to the rest of the lifecycle.

---

## 7. Stripe alignment (30 sec — use in Q&A or when asked about metrics)

Stripe’s internal coding agent uses **PRs produced without human code** as their north star — not “AI wrote X lines” or “Y% of code.” We’re aligned: we measure shippable PRs and customer gaps closed with traceability. Same playbook: powerful models, quality tooling (MCPs, rules), humans in the loop. We’re not vibe coding from zero — we’re adding features to an existing codebase with rules and tests. Tooling is the unlock; without MCPs we’d have an impressive demo; with them we have a runnable pipeline.

---

## 8. Limitations and future work (1 min)

- **Mocks today.** Swap to real Gong, Canny, Zendesk with config and credentials; the agent’s behavior doesn’t change.
- **Scale.** We keep signal volume small and have the agent summarize per source before triangulating. At scale we’d add a proper signal index, summarization at ingest, and embedding-based similarity so the same pipeline works over hundreds of calls and tickets. That’s future work we’ve scoped but not built.
- **Humans in the loop.** We still approve the plan and review the PR. The agent parallelizes the handoff; humans own scope and impact.

---

## 9. Close (30 sec)

**Takeaway:** We close the loop from “what the customer said” to “what we shipped” — with full traceability in the spec, the code, and the PR. One flow, three signals, one pattern.

**Enterprise ready:** And we package this entire workflow—rules, MCPs, hooks—as a single **Cursor Plugin**. You don't configure 500 laptops. You install the plugin once, and your whole org gets the same standardized, safe, high-velocity workflow.

**Final thought:** In this future, your constraint stops being **engineering capacity** and becomes **sequencing**. When code is abundant, the bottleneck moves to "what do we release next?" and "how do we market it?" That is why we built this prototype around **Signal**. We're not just automating code; we're automating the decision of *what* to code so you can focus on the release.

*Questions?*

---

## Quick reference: one-liners

- **Opener:** “Real-world dev is responding to customer feedback. We pull that feedback from Gong, Canny, and Zendesk into one place and turn it into a spec and code with full attribution.”
- **Problem:** “Signal lives in three systems; by the time it’s a Jira ticket the evidence is gone. We fix that.”
- **Flow:** “Ingest → triangulate by role and customer value → spec → build → verify → PR. One session.”
- **ROI:** “This feature exists because we turned this customer’s pain into this spec and this code. Here’s the quote; here’s the code.”
- **Prioritization:** “We don’t just count votes — we weight by who said it, whether they’re an existing customer, and deal potential.”
- **Same method:** “One pattern — signal → spec → build — applies to customer voice, incidents, security, design, review. We chose customer pain first; the primitives are the same everywhere.”
- **Stripe:** “Our north star is PRs without human code and customer gaps closed with traceability — same as Stripe’s. Tooling and humans in the loop.”
- **Close:** “Customer pain is the wedge; the framework is the multiplier. Questions?”

---

## 11. Handling the "PM" Objection (If asked)

**"Isn't prioritizing features a Product Manager's job?"**

*   **Scale:** No PM can read every Gong call, Zendesk ticket, and Canny vote in real-time. The agent synthesizes volume that humans simply can't.
*   **Evidence vs. Intuition:** PMs often have to rely on intuition or the "loudest sales rep." This tool gives them a draft spec backed by **traceable data**.
*   **The "Lost Signal" Gap:** Even if a PM writes a perfect spec, the *original customer context* (the recording, the ticket) rarely makes it to the engineer. This pipeline preserves that link so the dev knows *why* they're building it.
*   **Draft, not Decree:** The agent produces a *candidate* spec. The human (PM or Lead) still approves the plan. We're automating the synthesis, not the strategy.

**"Wasn't this project for developers?"**

*   **The definition is changing:** "Developer" isn't just someone who knows syntax anymore; it's anyone who builds. Cursor enables PMs, SEs, and technical leads to be builders—*if* they have the right guardrails.
*   **Guardrails make it safe:** That's why we emphasized **Rules** (architecture checks), **Hooks** (security scans), and **Tests**. These allow a broader group of people to contribute to the codebase without breaking production.
*   **For the "Traditional" Developer:** Even for a senior backend engineer, this tool removes the "detective work" of finding *why* a feature is needed. It lets them focus on architecture and hard problems rather than chasing context across three different tools.
