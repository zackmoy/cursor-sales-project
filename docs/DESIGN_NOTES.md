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

## Other things to keep in mind

- **MCPs in new chats:** If you add or fix an MCP, start a **new** Agent chat so the session has the updated tools.
- **Spec path:** Commands and prompts assume specs live under `specs/` (e.g. `specs/csv-bulk-export.md`). If you move them, update the command text and DEMO_SCRIPT.
- **Linear project/team:** The Linear MCP may need a default team or project (or the user says “put it in project X”). The command says “use what the user asks for, or leave default” — adjust per your workspace.
- **PM assignment:** “Correct PM” usually comes from the spec (stakeholder routing / origin) or from the user. The agent can set assignee when the spec or user names someone; otherwise it can suggest in a comment.
