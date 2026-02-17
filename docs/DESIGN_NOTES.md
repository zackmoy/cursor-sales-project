# Design notes: commands, prompts, and Linear

Short guide on how we use slash commands vs. free-form prompts, and how to use Linear without duplicates or lost context.

---

## Slash commands vs. free-form prompts

**Use slash commands when:**

- The workflow is **fixed** (same steps every time) and you want **one action** (e.g. “run signal → triangulate → spec” or “create/update Linear ticket from spec”).
- You want **consistency** across people or demos (same instructions, same order).
- You want the flow **versioned** in the repo (`.cursor/commands/*.md`) so the team can improve it.

**Use free-form prompts when:**

- The task is **one-off** or **variable** (e.g. “summarize this one call,” “add a label to SYT-17”).
- The user needs to **customize** the ask each time (different topic, different spec, different project).
- You’re **exploring** or debugging (e.g. “why didn’t triangulation pick X?”).

**This repo:**

- **Commands:** `/signal-to-spec` (ingest → triangulate → write spec), `/spec-to-linear` (create or update Linear issue from spec). Use these for the standard pipeline.
- **Prompts:** Everything else in [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) (build, verify, PR, etc.) is optional and can be copy-pasted or rephrased. We don’t need a command for every step.

**Rule of thumb:** If you find yourself pasting the same 3+ sentence prompt often, turn it into a command.

---

## Linear: avoid duplicates and enrich existing issues

**Duplicate check:** Before creating a new Linear issue from a spec, **search Linear** for an existing issue that matches the feature (e.g. by title or keywords from the spec). If one already exists, **don’t create a second one**.

**Existing issue not in progress:** If you find an existing issue that’s in **Backlog**, **Triage**, or similar (not yet **In Progress** / **Done**):

1. **Add a comment** with the new context: spec file path, signal origin (Gong/Canny/Zendesk), customer quotes, and link to the spec in the repo. That way the PM and eng have the full story in one place.
2. **Optionally assign** the issue to the right PM (if the spec’s “Stakeholder routing” or “Origin” names one, or if the user says who should own it). Use Linear’s assignee field; if you don’t know the PM’s Linear user, leave a note in the comment like “Suggested owner: [name from spec].”

**Existing issue already in progress:** Add a **comment** with the spec link and signal origin so the implementer has context; no need to change assignee or state unless the user asks.

The **`/spec-to-linear`** command is written to: search first → create only if no match → if match and not in progress, comment + optional assign. See `.cursor/commands/spec-to-linear.md`.

---

## Linear labels for metrics (Cursor-sourced, Cursor-built)

Create two labels in your Linear workspace (or on the team you use): **`Cursor-sourced`** and **`Cursor-built`** (Settings → Labels, or team labels). The pipeline will tag issues automatically:

- **Cursor-sourced:** Applied when an issue is **created** from a spec (`/spec-to-linear` or step 2 of `/signal-to-pr`) or when we **add context** to an existing issue (comment + label). Use for “issues that came from the Signal-to-Code pipeline.”
- **Cursor-built:** Applied when implementation is **done** via `/do-linear-ticket` or `/signal-to-pr` (after tests pass). Use for “issues that were implemented by the Cursor pipeline.”

You can then filter or report in Linear (e.g. “how many Cursor-sourced this quarter,” “how many Cursor-built”) for adoption and outcome metrics without building custom dashboards.

---

## Automation: slash command vs fully automated

**Can this run in a Cursor agent?**  
Yes. The pipeline **already runs in the Cursor Agent** (the in-chat agent you get with Cmd+L or Agent mode). When you type `/signal-to-spec`, `/spec-to-linear`, `/do-linear-ticket`, or `/signal-to-pr`, that agent executes the steps: it calls the MCPs, writes the spec, creates/updates the Linear issue, plans, implements, and opens the PR. There is no separate “headless” agent in this repo — the same Agent that you talk to in the chat runs the command.

**What’s automated today?**  
- **One-shot flow:** You start one Agent chat and invoke one command (e.g. `/signal-to-pr yolo`). The agent runs signal → spec → Linear → plan → implement → tests → PR without pausing for plan approval. The only required human action is **starting the chat and invoking the command**.  
- **With approval:** Default `/signal-to-pr` (no “yolo”) stops after the plan and waits for you to approve before implementing. So “automation” is configurable: full auto (yolo) vs human-in-the-loop at the plan step.

**What would “fully automated” mean (no human in the loop)?**  
Fully automated would mean the pipeline runs **without** a human opening Cursor and typing the command. That requires a **trigger** that can start an agent session, for example:

1. **Cursor Background Agent** (if/when it supports it): A Background Agent that runs on a **schedule** (e.g. nightly) or on **events** (e.g. “new Gong call transcribed,” “new Canny request above N votes”) and executes the same pipeline (e.g. ingest → triangulate → spec → Linear; optionally implement + PR with guardrails). The PRD’s “Phase 2/3” (nightly signal ingestion, auto-triage, weekly digest) is this model.
2. **Cursor API or CLI:** If Cursor exposed an API or CLI that could “start an agent task” with a prompt (e.g. “run the signal-to-pr flow for repo X with yolo”), then an external scheduler (cron, GitHub Action, Zapier) or webhook could trigger the pipeline. Today we’re not aware of a public Cursor API for that.
3. **External runner:** Reimplement the non–code-gen parts outside Cursor (script that calls Gong/Canny/Zendesk, calls an LLM API for triangulation/spec, creates Linear issue, then triggers Cursor or another code-gen tool for the “build” step). That’s a different architecture; the “single agent in Cursor” story is lost.

**Summary:**  
- **Runs in Cursor agent?** Yes — the in-chat Agent runs the whole pipeline today.  
- **Fully automated (no human)?** Only if something can **trigger** that agent (Background Agent with triggers, or Cursor API to start agent tasks). The pipeline is already agent-runnable; the gap is product support for trigger-based execution.

---

## Other things to keep in mind

- **MCPs in new chats:** If you add or fix an MCP, start a **new** Agent chat so the session has the updated tools.
- **Spec path:** Commands and prompts assume specs live under `specs/` (e.g. `specs/csv-bulk-export.md`). If you move them, update the command text and DEMO_SCRIPT.
- **Linear project/team:** The Linear MCP may need a default team or project (or the user says “put it in project X”). The command says “use what the user asks for, or leave default” — adjust per your workspace.
- **PM assignment:** “Correct PM” usually comes from the spec (stakeholder routing / origin) or from the user. The agent can set assignee when the spec or user names someone; otherwise it can suggest in a comment.
