# Signal-to-Code: Live Demo Script

Use this when demoing **pull signal → triangulate → spec → build code** in Cursor. The mock MCP servers (Gong, Canny, Zendesk, Product) must be running and connected.

---

## Standard command: steps 1–3 in one go

**Type `/signal-to-spec`** in the Agent chat (Cmd+L). That runs a custom Cursor command that does **Ingest → Triangulate → Spec** in a single flow: the agent pulls from Gong, Canny, and Zendesk, builds the cross-source table, picks the top feature, and writes the spec to `specs/`. No need to paste the three prompts below unless you want to run them step by step.

The command is defined in **`.cursor/commands/signal-to-spec.md`**. You can edit that file to change topics (e.g. “SSO” instead of “analytics and export”) or the spec filename.

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

3. **Optional but helpful:** Add the pipeline rules so the agent triangulates and formats specs consistently. From the PRD, create (or copy) into `.cursor/rules/`:
   - `signal-analysis.mdc` — cross-source triangulation, signal strength
   - `spec-template.mdc` — spec format with multi-source attribution  
   If you skip rules, the agent will still call the MCPs and produce a spec; the output may be less structured.

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
Pull recent customer signal about analytics and export:
1. Use the Gong tools to search for calls from the last two weeks that mention analytics or export, then get the transcript for the most relevant call.
2. Use the Canny tools to search for feature requests about export or CSV.
3. Use the Zendesk tools to search for tickets tagged export or csv.

Summarize what you found from each source (calls, feature requests, support tickets) in one short report.
```

**What should happen:** The agent calls `search_calls`, `get_transcript`, `search_feature_requests`, and `search_tickets`. You get a summary that includes Acme Corp’s CSV export pain (Gong), the 47-upvote Canny request, and Zendesk tickets about export workarounds.

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

That command is defined in `.cursor/commands/spec-to-linear.md`. The agent will read the spec (e.g. `specs/csv-bulk-export.md`), then use the Linear MCP to create an issue with the feature name, origin, problem statement, and requirements. You can then say “put it in project X” or “add label Y” if needed.

Or ask in plain language: *“Create a Linear issue from specs/csv-bulk-export.md and set the project to [your project].”*

### Do a specific Linear ticket (plan + implement)

After a feature is in Linear, you can implement it from the ticket in one go.

**Command:** **`/do-linear-ticket`** — then in the same or next message give the **issue id** (e.g. `SYT-17`) or the **full issue URL**.

Example: type `/do-linear-ticket` and then `SYT-17`, or paste the Linear issue URL.

The agent fetches the issue from Linear, finds the spec (from the issue or a matching file in `specs/`), writes a short plan, and after you approve implements (services, routes, components, tests). Command: `.cursor/commands/do-linear-ticket.md`.

---

## Quick reference: MCP tools

| Server          | Tools                                                                 |
|-----------------|-----------------------------------------------------------------------|
| **gong-mock**   | `search_calls`, `get_transcript`, `get_call_participants`             |
| **canny-mock**  | `search_feature_requests`, `get_request_details`, `get_request_voters`|
| **zendesk-mock**| `search_tickets`, `get_ticket_details`, `get_ticket_comments`         |
| **product-server-mock** | `lookup_customer`, `verify_feature_compatibility`              |
| **linear**      | Create/update issues, list projects, etc. (remote; OAuth)             |

Mock data is aligned: **Acme Corp** and **CSV export** appear in Gong, Canny, and Zendesk so the agent can triangulate one clear top priority.

---

## Design notes (commands vs prompts, Linear duplicates)

See **[docs/DESIGN_NOTES.md](DESIGN_NOTES.md)** for:

- When to use **slash commands** vs **free-form prompts**
- **Linear:** checking for duplicates before creating an issue, and **commenting on existing backlog issues** with spec context + optional PM assignee instead of creating a new ticket
- Other gotchas (new chat after MCP changes, spec path, PM assignment)
