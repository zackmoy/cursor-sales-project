#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "gong-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Mock data — multiple calls with varied signal types
// ---------------------------------------------------------------------------

const MOCK_CALLS = [
  {
    id: "call-001",
    title: "Acme Corp - Q1 Analytics Review",
    date: "2026-02-10T14:00:00Z",
    duration: 2700,
    participants: [
      { name: "Jane Smith", email: "jane@acmecorp.com", title: "VP of Engineering", company: "Acme Corp", isExternal: true },
      { name: "Mike Chen", email: "mike@ourcompany.com", title: "Account Executive", company: "Our Company", isExternal: false },
      { name: "Sarah Lee", email: "sarah@ourcompany.com", title: "Solutions Engineer", company: "Our Company", isExternal: false },
    ],
    topics: ["analytics", "export", "reporting", "competitor-mention"],
  },
  {
    id: "call-002",
    title: "Globex Industries - Technical Evaluation",
    date: "2026-02-12T10:00:00Z",
    duration: 1800,
    participants: [
      { name: "Tom Wilson", email: "tom@globex.com", title: "CTO", company: "Globex Industries", isExternal: true },
      { name: "Lisa Park", email: "lisa@ourcompany.com", title: "Account Executive", company: "Our Company", isExternal: false },
    ],
    topics: ["sso", "security", "compliance", "evaluation"],
  },
  {
    id: "call-003",
    title: "Stark Industries - Dashboard Review & Roadmap",
    date: "2026-02-13T16:00:00Z",
    duration: 3200,
    participants: [
      { name: "Anna Reyes", email: "anna@stark.io", title: "Director of Data", company: "Stark Industries", isExternal: true },
      { name: "James Obi", email: "james@stark.io", title: "Senior Analyst", company: "Stark Industries", isExternal: true },
      { name: "Mike Chen", email: "mike@ourcompany.com", title: "Account Executive", company: "Our Company", isExternal: false },
    ],
    topics: ["analytics", "dashboard", "export", "customization", "reporting"],
  },
  {
    id: "call-004",
    title: "Beta Inc - Renewal Check-in",
    date: "2026-02-14T11:00:00Z",
    duration: 1500,
    participants: [
      { name: "Carlos Vega", email: "carlos@beta.dev", title: "Engineering Manager", company: "Beta Inc", isExternal: true },
      { name: "Lisa Park", email: "lisa@ourcompany.com", title: "Account Executive", company: "Our Company", isExternal: false },
    ],
    topics: ["renewal", "dashboard", "customization", "pricing"],
  },
];

const MOCK_TRANSCRIPTS = {
  "call-001": [
    { speaker: "Mike Chen", timestamp: "00:02:15", text: "Jane, thanks for making time. How's the team finding the analytics dashboard?" },
    { speaker: "Jane Smith", timestamp: "00:02:45", text: "Honestly, the dashboard itself is great. My team loves the real-time view. But we have a real problem with reporting." },
    { speaker: "Jane Smith", timestamp: "00:03:10", text: "Every quarter, I need to pull data for our board deck. Right now, my analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It's embarrassing." },
    { speaker: "Sarah Lee", timestamp: "00:03:35", text: "That's painful. What format does your board reporting need?" },
    { speaker: "Jane Smith", timestamp: "00:03:50", text: "CSV would be perfect. We just need to be able to select a date range, pick which metrics we want, and export. Datadog lets us do this and we're getting pressure to switch." },
    { speaker: "Mike Chen", timestamp: "00:04:20", text: "I hear you. How urgent is this for your team?" },
    { speaker: "Jane Smith", timestamp: "00:04:35", text: "Very. Our Q1 board meeting is in six weeks. If we can't export by then, I'll have to escalate to my CTO and we might need to evaluate alternatives. But honestly I'd rather just have you fix it. We love everything else about the product." },
    { speaker: "Jane Smith", timestamp: "00:05:00", text: "Also, if you ship this, I've been talking to our VP of Sales about getting seats for his team too. That would be another 30 seats." },
  ],
  "call-002": [
    { speaker: "Lisa Park", timestamp: "00:01:00", text: "Tom, excited to walk through the platform today. What are the key things you need to see?" },
    { speaker: "Tom Wilson", timestamp: "00:01:20", text: "Two things are make-or-break for us. First, SSO. We're an Azure AD shop and everything has to go through our identity provider. No SSO, no deal." },
    { speaker: "Tom Wilson", timestamp: "00:01:50", text: "Second, I need to understand your security posture. We're in financial services so SOC 2 is table stakes. Are you compliant?" },
    { speaker: "Lisa Park", timestamp: "00:02:15", text: "Great news on SOC 2 — we're Type II certified. On SSO, we support SAML and OIDC. Azure AD works natively." },
    { speaker: "Tom Wilson", timestamp: "00:02:45", text: "Oh, that's actually ahead of where I thought you'd be. My team of 50 engineers has been struggling with our current tool. If SSO and the security story check out, we have budget approved for this quarter." },
  ],
  "call-003": [
    { speaker: "Mike Chen", timestamp: "00:01:30", text: "Anna, James — great to have you both. I know you had a list of topics for today." },
    { speaker: "Anna Reyes", timestamp: "00:02:00", text: "Yes. First, export. We have the same problem Jane at Acme mentioned to you — we need CSV export badly. Our data team runs quarterly reviews and right now they're screen-scraping the dashboard." },
    { speaker: "James Obi", timestamp: "00:02:30", text: "Specifically, we need to be able to export filtered data — not just the full dump, but what's on screen after we apply date range and metric filters. And the column headers need to match what the dashboard shows." },
    { speaker: "Anna Reyes", timestamp: "00:03:00", text: "The other big ask is dashboard customization. We want saved views — different dashboards for different teams. My data team needs one view, the product team needs another, execs want a high-level summary." },
    { speaker: "James Obi", timestamp: "00:03:30", text: "We've also noticed the dashboard can get slow when we query more than 90 days of data. Is that a known issue?" },
    { speaker: "Mike Chen", timestamp: "00:04:00", text: "I'll flag the performance concern for our engineering team. On customization and export — both are on the roadmap. How would you prioritize between them?" },
    { speaker: "Anna Reyes", timestamp: "00:04:20", text: "Export first, no question. We can live with the default dashboard layout. We can't live without being able to get data out for our board." },
  ],
  "call-004": [
    { speaker: "Lisa Park", timestamp: "00:01:00", text: "Carlos, thanks for hopping on. You're up for renewal in April — wanted to check in on how things are going." },
    { speaker: "Carlos Vega", timestamp: "00:01:20", text: "Honestly, the dashboard is useful but we're a small team and the pricing feels steep for what we get. We're on the Starter plan and we keep hitting limits." },
    { speaker: "Carlos Vega", timestamp: "00:01:50", text: "The thing we'd really love is to customize the dashboard — rearrange widgets, hide metrics we don't use. It's cluttered for our use case." },
    { speaker: "Lisa Park", timestamp: "00:02:10", text: "I hear you on the customization. That's something a few customers have brought up." },
    { speaker: "Carlos Vega", timestamp: "00:02:30", text: "Also, is there any way to get data out? Even a simple CSV export would help. We sometimes need to pull numbers for our investors." },
    { speaker: "Lisa Park", timestamp: "00:02:50", text: "Export is on the roadmap — I'll keep you posted. Anything else before renewal?" },
    { speaker: "Carlos Vega", timestamp: "00:03:10", text: "Just the pricing. If customization and export land, we'd definitely renew. Without them, we'll probably downgrade or look elsewhere." },
  ],
};

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.tool(
  "search_calls",
  "Search Gong calls by date range or topic keywords. Returns call metadata including participants.",
  {
    fromDate: z.string().optional().describe("Start date ISO format"),
    toDate: z.string().optional().describe("End date ISO format"),
    keywords: z.array(z.string()).optional().describe("Topic keywords to filter by"),
  },
  async ({ keywords }) => {
    let results = [...MOCK_CALLS];
    if (keywords?.length) {
      results = results.filter((call) =>
        call.topics.some((t) => keywords.some((kw) => t.toLowerCase().includes(kw.toLowerCase())))
      );
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_transcript",
  "Get the full transcript for a specific Gong call. Returns speaker-attributed, timestamped dialogue.",
  { callId: z.string().describe("The Gong call ID") },
  async ({ callId }) => {
    const transcript = MOCK_TRANSCRIPTS[callId];
    if (!transcript) return { content: [{ type: "text", text: `No transcript found for call ${callId}` }] };
    return { content: [{ type: "text", text: JSON.stringify(transcript, null, 2) }] };
  }
);

server.tool(
  "get_call_participants",
  "Get participant details for a call, including whether they are internal or external (customer/prospect).",
  { callId: z.string().describe("The Gong call ID") },
  async ({ callId }) => {
    const call = MOCK_CALLS.find((c) => c.id === callId);
    if (!call) return { content: [{ type: "text", text: `Call ${callId} not found` }] };
    return { content: [{ type: "text", text: JSON.stringify(call.participants, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
