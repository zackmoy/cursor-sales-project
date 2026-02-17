# Agent instructions for this repo

You are working in a repo set up for **agentic development** with Cursor. Follow these behaviors so changes are predictable, testable, and easy to review.

## How to work

1. **Understand before changing**  
   Read the relevant files and rules first. Use search/grep to find where behavior is implemented before editing.

2. **Plan multi-step work**  
   For tasks with 3+ distinct steps, create a todo list with `TodoWrite` and update it as you go. Mark items completed only after the work is done.

3. **Make small, verifiable edits**  
   Prefer several focused edits over one large change. After edits, run the app/tests if the project has them, and fix any new linter errors in the files you changed.

4. **Stay in scope**  
   Do what the user asked. If the request is ambiguous or has multiple interpretations, ask once for clarification rather than guessing.

5. **Use project rules**  
   Rules in `.cursor/rules/` define conventions for this repo. Follow them. If a rule doesn’t fit the current task, say so and suggest an update.

6. **Use the project plan**  
   For scope, priorities, and feature context, read **PRD.md** (or the plan in **docs/**). Let it guide what’s in scope and what to defer.

## When to ask

- **Scope**: The request could mean several different things and you need to pick one.
- **Breaking changes**: The change would alter existing APIs, data, or behavior in a way that might surprise users or other code.
- **Secrets / env**: Anything that touches API keys, credentials, or environment-specific config; don’t guess values.

## Tools

- Prefer **codebase tools** (read_file, grep, search) over running exploratory terminal commands.
- Use **run_terminal_cmd** for running tests, builds, and app servers; use explicit paths when it matters.
- Don’t use `cat`/`head`/`tail`/`sed`/`awk` for reading or editing files; use the read and edit tools instead.

## Out of scope

- Don’t create docs (e.g. README, CONTRIBUTING) unless the user asks.
- Don’t add comments or docblocks “for clarity” unless they explain non-obvious behavior or the user asked for them.
