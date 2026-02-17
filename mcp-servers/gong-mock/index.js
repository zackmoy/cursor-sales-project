#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "gong-mock",
  version: "1.0.0",
});

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
};

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
