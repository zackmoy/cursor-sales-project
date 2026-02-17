#!/usr/bin/env node
/**
 * Gong Mock MCP Server
 *
 * Returns data shaped to match the real Gong API v2 response schemas.
 * Endpoints modeled:
 *   - GET  /v2/calls          → search_calls
 *   - POST /v2/calls/transcript → get_transcript
 *   - (derived from calls)     → get_call_participants
 *
 * Reference: https://gong.app.gong.io/settings/api/documentation
 * Community MCP: https://github.com/kenazk/gong-mcp
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "gong-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Zod schemas — mirrors Gong API v2 response shapes
// ---------------------------------------------------------------------------

/** Gong API v2: Party object (participant on a call) */
const GongPartySchema = z.object({
  id: z.string(),
  emailAddress: z.string().email(),
  name: z.string(),
  title: z.string().optional(),
  userId: z.string().optional(),
  speakerId: z.string(),
  affiliation: z.enum(["Internal", "External", "Unknown"]),
  phoneNumber: z.string().optional(),
  methods: z.array(z.string()).optional(),
});

/** Gong API v2: Call object returned by GET /v2/calls */
const GongCallSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  scheduled: z.string().datetime(),
  started: z.string().datetime(),
  duration: z.number().describe("Duration in seconds"),
  primaryUserId: z.string(),
  direction: z.enum(["Inbound", "Outbound", "Conference", "Unknown"]),
  system: z.string().optional(),
  scope: z.enum(["Internal", "External", "Unknown"]),
  media: z.enum(["Video", "Phone", "WebConference", "Unknown"]),
  language: z.string().optional(),
  workspaceId: z.string().optional(),
  sdrDisposition: z.string().optional(),
  clientUniqueId: z.string().optional(),
  customData: z.string().optional(),
  purpose: z.string().optional(),
  meetingUrl: z.string().optional(),
  isPrivate: z.boolean(),
  calendarEventId: z.string().optional(),
  parties: z.array(GongPartySchema),
});

/** Gong API v2: Sentence within a transcript monologue */
const GongSentenceSchema = z.object({
  start: z.number().describe("Offset in milliseconds from call start"),
  end: z.number().describe("Offset in milliseconds from call start"),
  text: z.string(),
});

/** Gong API v2: Single monologue within a transcript */
const GongMonologueSchema = z.object({
  speakerId: z.string(),
  topic: z.string().optional(),
  sentences: z.array(GongSentenceSchema),
});

/** Gong API v2: Transcript object from POST /v2/calls/transcript */
const GongCallTranscriptSchema = z.object({
  callId: z.string(),
  transcript: z.array(GongMonologueSchema),
});

// ---------------------------------------------------------------------------
// Mock data — shaped to match Gong API v2 response format
// ---------------------------------------------------------------------------

/** @type {z.infer<typeof GongCallSchema>[]} */
const MOCK_CALLS = [
  {
    id: "7782822860530291749",
    url: "https://app.gong.io/call?id=7782822860530291749",
    title: "Acme Corp - Q1 Analytics Review",
    scheduled: "2026-02-10T14:00:00Z",
    started: "2026-02-10T14:02:12Z",
    duration: 2700,
    primaryUserId: "234599484848423948",
    direction: "Outbound",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "en-US",
    workspaceId: "623457276584334",
    isPrivate: false,
    parties: [
      { id: "p-001", emailAddress: "jane@acmecorp.com", name: "Jane Smith", title: "VP of Engineering", speakerId: "s-001", affiliation: "External" },
      { id: "p-002", emailAddress: "mike@ourcompany.com", name: "Mike Chen", title: "Account Executive", userId: "234599484848423948", speakerId: "s-002", affiliation: "Internal" },
      { id: "p-003", emailAddress: "sarah@ourcompany.com", name: "Sarah Lee", title: "Solutions Engineer", userId: "234599484848423949", speakerId: "s-003", affiliation: "Internal" },
    ],
  },
  {
    id: "7782822860530291750",
    url: "https://app.gong.io/call?id=7782822860530291750",
    title: "Globex Industries - Technical Evaluation",
    scheduled: "2026-02-12T10:00:00Z",
    started: "2026-02-12T10:01:05Z",
    duration: 1800,
    primaryUserId: "234599484848423950",
    direction: "Outbound",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "en-US",
    workspaceId: "623457276584334",
    isPrivate: false,
    parties: [
      { id: "p-004", emailAddress: "tom@globex.com", name: "Tom Wilson", title: "CTO", speakerId: "s-004", affiliation: "External" },
      { id: "p-005", emailAddress: "lisa@ourcompany.com", name: "Lisa Park", title: "Account Executive", userId: "234599484848423950", speakerId: "s-005", affiliation: "Internal" },
    ],
  },
  {
    id: "7782822860530291751",
    url: "https://app.gong.io/call?id=7782822860530291751",
    title: "Stark Industries - Dashboard Review & Roadmap",
    scheduled: "2026-02-13T16:00:00Z",
    started: "2026-02-13T16:03:22Z",
    duration: 3200,
    primaryUserId: "234599484848423948",
    direction: "Outbound",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "en-US",
    workspaceId: "623457276584334",
    isPrivate: false,
    parties: [
      { id: "p-006", emailAddress: "anna@stark.io", name: "Anna Reyes", title: "Director of Data", speakerId: "s-006", affiliation: "External" },
      { id: "p-007", emailAddress: "james@stark.io", name: "James Obi", title: "Senior Analyst", speakerId: "s-007", affiliation: "External" },
      { id: "p-008", emailAddress: "mike@ourcompany.com", name: "Mike Chen", title: "Account Executive", userId: "234599484848423948", speakerId: "s-002", affiliation: "Internal" },
    ],
  },
  {
    id: "7782822860530291752",
    url: "https://app.gong.io/call?id=7782822860530291752",
    title: "Beta Inc - Renewal Check-in",
    scheduled: "2026-02-14T11:00:00Z",
    started: "2026-02-14T11:00:43Z",
    duration: 1500,
    primaryUserId: "234599484848423950",
    direction: "Outbound",
    system: "Zoom",
    scope: "External",
    media: "Video",
    language: "en-US",
    workspaceId: "623457276584334",
    isPrivate: false,
    parties: [
      { id: "p-009", emailAddress: "carlos@beta.dev", name: "Carlos Vega", title: "Engineering Manager", speakerId: "s-008", affiliation: "External" },
      { id: "p-010", emailAddress: "lisa@ourcompany.com", name: "Lisa Park", title: "Account Executive", userId: "234599484848423950", speakerId: "s-005", affiliation: "Internal" },
    ],
  },
];

/**
 * Transcripts shaped to match Gong API v2 POST /v2/calls/transcript response.
 * Each entry is a callTranscript with speakerId-attributed monologues containing
 * timestamped sentences (offsets in milliseconds).
 *
 * @type {Record<string, z.infer<typeof GongCallTranscriptSchema>>}
 */
const MOCK_TRANSCRIPTS = {
  "7782822860530291749": {
    callId: "7782822860530291749",
    transcript: [
      { speakerId: "s-002", topic: "Opening", sentences: [
        { start: 135000, end: 141000, text: "Jane, thanks for making time. How's the team finding the analytics dashboard?" },
      ]},
      { speakerId: "s-001", topic: "Product Feedback", sentences: [
        { start: 165000, end: 176000, text: "Honestly, the dashboard itself is great. My team loves the real-time view. But we have a real problem with reporting." },
        { start: 190000, end: 210000, text: "Every quarter, I need to pull data for our board deck. Right now, my analysts are literally screenshotting charts and manually copying numbers into spreadsheets. It's embarrassing." },
      ]},
      { speakerId: "s-003", topic: "Requirements Discovery", sentences: [
        { start: 215000, end: 219000, text: "That's painful. What format does your board reporting need?" },
      ]},
      { speakerId: "s-001", topic: "Feature Request", sentences: [
        { start: 230000, end: 252000, text: "CSV would be perfect. We just need to be able to select a date range, pick which metrics we want, and export. Datadog lets us do this and we're getting pressure to switch." },
      ]},
      { speakerId: "s-002", sentences: [
        { start: 260000, end: 264000, text: "I hear you. How urgent is this for your team?" },
      ]},
      { speakerId: "s-001", topic: "Urgency & Expansion", sentences: [
        { start: 275000, end: 305000, text: "Very. Our Q1 board meeting is in six weeks. If we can't export by then, I'll have to escalate to my CTO and we might need to evaluate alternatives. But honestly I'd rather just have you fix it. We love everything else about the product." },
        { start: 300000, end: 318000, text: "Also, if you ship this, I've been talking to our VP of Sales about getting seats for his team too. That would be another 30 seats." },
      ]},
    ],
  },
  "7782822860530291750": {
    callId: "7782822860530291750",
    transcript: [
      { speakerId: "s-005", topic: "Opening", sentences: [
        { start: 60000, end: 70000, text: "Tom, excited to walk through the platform today. What are the key things you need to see?" },
      ]},
      { speakerId: "s-004", topic: "Requirements", sentences: [
        { start: 80000, end: 98000, text: "Two things are make-or-break for us. First, SSO. We're an Azure AD shop and everything has to go through our identity provider. No SSO, no deal." },
        { start: 110000, end: 124000, text: "Second, I need to understand your security posture. We're in financial services so SOC 2 is table stakes. Are you compliant?" },
      ]},
      { speakerId: "s-005", topic: "Capabilities", sentences: [
        { start: 135000, end: 150000, text: "Great news on SOC 2 — we're Type II certified. On SSO, we support SAML and OIDC. Azure AD works natively." },
      ]},
      { speakerId: "s-004", topic: "Deal Signal", sentences: [
        { start: 165000, end: 188000, text: "Oh, that's actually ahead of where I thought you'd be. My team of 50 engineers has been struggling with our current tool. If SSO and the security story check out, we have budget approved for this quarter." },
      ]},
    ],
  },
  "7782822860530291751": {
    callId: "7782822860530291751",
    transcript: [
      { speakerId: "s-002", topic: "Opening", sentences: [
        { start: 90000, end: 100000, text: "Anna, James — great to have you both. I know you had a list of topics for today." },
      ]},
      { speakerId: "s-006", topic: "Export Request", sentences: [
        { start: 120000, end: 145000, text: "Yes. First, export. We have the same problem Jane at Acme mentioned to you — we need CSV export badly. Our data team runs quarterly reviews and right now they're screen-scraping the dashboard." },
      ]},
      { speakerId: "s-007", topic: "Export Details", sentences: [
        { start: 150000, end: 175000, text: "Specifically, we need to be able to export filtered data — not just the full dump, but what's on screen after we apply date range and metric filters. And the column headers need to match what the dashboard shows." },
      ]},
      { speakerId: "s-006", topic: "Dashboard Customization", sentences: [
        { start: 180000, end: 205000, text: "The other big ask is dashboard customization. We want saved views — different dashboards for different teams. My data team needs one view, the product team needs another, execs want a high-level summary." },
      ]},
      { speakerId: "s-007", topic: "Performance", sentences: [
        { start: 210000, end: 228000, text: "We've also noticed the dashboard can get slow when we query more than 90 days of data. Is that a known issue?" },
      ]},
      { speakerId: "s-002", sentences: [
        { start: 240000, end: 258000, text: "I'll flag the performance concern for our engineering team. On customization and export — both are on the roadmap. How would you prioritize between them?" },
      ]},
      { speakerId: "s-006", topic: "Prioritization", sentences: [
        { start: 260000, end: 278000, text: "Export first, no question. We can live with the default dashboard layout. We can't live without being able to get data out for our board." },
      ]},
    ],
  },
  "7782822860530291752": {
    callId: "7782822860530291752",
    transcript: [
      { speakerId: "s-005", topic: "Renewal", sentences: [
        { start: 60000, end: 72000, text: "Carlos, thanks for hopping on. You're up for renewal in April — wanted to check in on how things are going." },
      ]},
      { speakerId: "s-008", topic: "Product Feedback", sentences: [
        { start: 80000, end: 100000, text: "Honestly, the dashboard is useful but we're a small team and the pricing feels steep for what we get. We're on the Starter plan and we keep hitting limits." },
        { start: 110000, end: 130000, text: "The thing we'd really love is to customize the dashboard — rearrange widgets, hide metrics we don't use. It's cluttered for our use case." },
      ]},
      { speakerId: "s-005", sentences: [
        { start: 130000, end: 138000, text: "I hear you on the customization. That's something a few customers have brought up." },
      ]},
      { speakerId: "s-008", topic: "Export & Churn Risk", sentences: [
        { start: 150000, end: 168000, text: "Also, is there any way to get data out? Even a simple CSV export would help. We sometimes need to pull numbers for our investors." },
      ]},
      { speakerId: "s-005", sentences: [
        { start: 170000, end: 180000, text: "Export is on the roadmap — I'll keep you posted. Anything else before renewal?" },
      ]},
      { speakerId: "s-008", topic: "Churn Risk", sentences: [
        { start: 190000, end: 208000, text: "Just the pricing. If customization and export land, we'd definitely renew. Without them, we'll probably downgrade or look elsewhere." },
      ]},
    ],
  },
};

// ---------------------------------------------------------------------------
// Topic index — allows keyword search similar to Gong's topic detection
// We build this from transcript content so our search_calls behavior mirrors
// the real API's content-based filtering.
// ---------------------------------------------------------------------------

const CALL_TOPICS = {
  "7782822860530291749": ["analytics", "export", "reporting", "csv", "competitor-mention"],
  "7782822860530291750": ["sso", "security", "compliance", "evaluation"],
  "7782822860530291751": ["analytics", "dashboard", "export", "customization", "reporting", "performance"],
  "7782822860530291752": ["renewal", "dashboard", "customization", "pricing", "export"],
};

// ---------------------------------------------------------------------------
// Tools — same tool names as before, but responses match Gong API v2 shapes
// ---------------------------------------------------------------------------

server.tool(
  "search_calls",
  "Search Gong calls by date range or topic keywords. Returns call metadata including participants.",
  {
    fromDate: z.string().optional().describe("Start date ISO format"),
    toDate: z.string().optional().describe("End date ISO format"),
    keywords: z.array(z.string()).optional().describe("Topic keywords to filter by"),
  },
  async ({ fromDate, toDate, keywords }) => {
    let results = [...MOCK_CALLS];

    if (fromDate) {
      const from = new Date(fromDate);
      results = results.filter((call) => new Date(call.started) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      results = results.filter((call) => new Date(call.started) <= to);
    }
    if (keywords?.length) {
      results = results.filter((call) => {
        const topics = CALL_TOPICS[call.id] || [];
        return topics.some((t) => keywords.some((kw) => t.toLowerCase().includes(kw.toLowerCase())));
      });
    }

    // Mirror Gong API v2 GET /v2/calls response envelope
    const response = {
      requestId: "mock-req-" + Date.now(),
      records: {
        totalRecords: results.length,
        currentPageSize: results.length,
        currentPageNumber: 0,
      },
      calls: results,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }
);

server.tool(
  "get_transcript",
  "Get the full transcript for a specific Gong call. Returns speaker-attributed, timestamped dialogue.",
  { callId: z.string().describe("The Gong call ID") },
  async ({ callId }) => {
    const transcript = MOCK_TRANSCRIPTS[callId];
    if (!transcript) {
      return { content: [{ type: "text", text: `No transcript found for call ${callId}` }] };
    }

    // Mirror Gong API v2 POST /v2/calls/transcript response envelope
    const response = {
      requestId: "mock-req-" + Date.now(),
      records: {
        totalRecords: 1,
        currentPageSize: 1,
        currentPageNumber: 0,
      },
      callTranscripts: [transcript],
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }
);

server.tool(
  "get_call_participants",
  "Get participant details for a call, including whether they are internal or external (customer/prospect).",
  { callId: z.string().describe("The Gong call ID") },
  async ({ callId }) => {
    const call = MOCK_CALLS.find((c) => c.id === callId);
    if (!call) {
      return { content: [{ type: "text", text: `Call ${callId} not found` }] };
    }

    // Parties are part of the call object in the real API; we return just the
    // parties array for convenience, preserving the Gong Party schema.
    return { content: [{ type: "text", text: JSON.stringify(call.parties, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
