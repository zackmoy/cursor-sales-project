#!/usr/bin/env node
/**
 * Zendesk Mock MCP Server
 *
 * Returns data shaped to match the real Zendesk Support API v2 response schemas.
 * Endpoints modeled:
 *   - GET  /api/v2/search.json         → search_tickets
 *   - GET  /api/v2/tickets/{id}.json   → get_ticket_details
 *   - GET  /api/v2/tickets/{id}/comments.json → get_ticket_comments
 *
 * Reference: https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/
 *            https://developer.zendesk.com/api-reference/ticketing/ticket-management/search/
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "zendesk-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Zod schemas — mirrors Zendesk Support API v2 response shapes
// ---------------------------------------------------------------------------

/** Zendesk API v2: Via object describing ticket origin */
const ZendeskViaSchema = z.object({
  channel: z.enum(["web", "email", "api", "chat", "mobile", "twitter", "facebook"]),
  source: z.object({
    from: z.record(z.unknown()).optional(),
    to: z.record(z.unknown()).optional(),
    rel: z.string().optional(),
  }).optional(),
});

/** Zendesk API v2: Ticket object from GET /api/v2/tickets/{id}.json */
const ZendeskTicketSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  external_id: z.string().nullable(),
  type: z.enum(["problem", "incident", "question", "task"]).nullable(),
  subject: z.string(),
  raw_subject: z.string(),
  description: z.string(),
  priority: z.enum(["urgent", "high", "normal", "low"]).nullable(),
  status: z.enum(["new", "open", "pending", "hold", "solved", "closed"]),
  requester_id: z.number(),
  submitter_id: z.number(),
  assignee_id: z.number().nullable(),
  organization_id: z.number().nullable(),
  group_id: z.number().nullable(),
  collaborator_ids: z.array(z.number()),
  follower_ids: z.array(z.number()),
  tags: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  due_at: z.string().datetime().nullable(),
  via: ZendeskViaSchema,
  custom_fields: z.array(z.object({ id: z.number(), value: z.string().nullable() })),
  satisfaction_rating: z.object({ score: z.string() }).nullable(),
  brand_id: z.number().optional(),
  is_public: z.boolean(),
  has_incidents: z.boolean(),
  result_type: z.literal("ticket").optional(),
});

/** Zendesk API v2: Comment object from GET /api/v2/tickets/{id}/comments.json */
const ZendeskCommentSchema = z.object({
  id: z.number(),
  type: z.literal("Comment"),
  body: z.string(),
  html_body: z.string(),
  plain_body: z.string(),
  public: z.boolean(),
  author_id: z.number(),
  attachments: z.array(z.unknown()),
  created_at: z.string().datetime(),
  metadata: z.object({ system: z.record(z.unknown()).optional() }).optional(),
  via: ZendeskViaSchema.optional(),
});

// ---------------------------------------------------------------------------
// Mock organizations and requesters — gives us realistic ID mappings
// ---------------------------------------------------------------------------

const ORGS = {
  "Acme Corp": { org_id: 509974, requester_id: 20978392, requester_name: "Jane Smith" },
  "Initech": { org_id: 509975, requester_id: 20978393, requester_name: "David Kim" },
  "Stark Industries": { org_id: 509976, requester_id: 20978394, requester_name: "James Obi" },
  "Globex Industries": { org_id: 509977, requester_id: 20978395, requester_name: "Tom Wilson" },
  "Beta Inc": { org_id: 509978, requester_id: 20978396, requester_name: "Carlos Vega" },
};

const SUPPORT_AGENT_ID = 23532301;

// ---------------------------------------------------------------------------
// Mock tickets — shaped to match Zendesk API v2 ticket objects
// ---------------------------------------------------------------------------

/** @type {z.infer<typeof ZendeskTicketSchema>[]} */
const MOCK_TICKETS = [
  // Export / CSV cluster (strong signal)
  {
    id: 35001, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35001.json",
    external_id: null, type: "question",
    subject: "Is there any way to export the monthly analytics as a CSV?",
    raw_subject: "Is there any way to export the monthly analytics as a CSV?",
    description: "We need to export analytics data as CSV for our board reporting workflow. Currently we have no way to get data out of the dashboard programmatically.",
    priority: "high", status: "open",
    requester_id: ORGS["Acme Corp"].requester_id, submitter_id: ORGS["Acme Corp"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Acme Corp"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["export", "csv", "reporting"],
    created_at: "2026-02-08T09:15:00Z", updated_at: "2026-02-10T14:22:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },
  {
    id: 35002, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35002.json",
    external_id: null, type: "question",
    subject: "Workaround for getting dashboard data into Excel",
    raw_subject: "Workaround for getting dashboard data into Excel",
    description: "Is there any supported workaround to get analytics dashboard data into a spreadsheet? We tried copy-pasting from the browser dev tools but lost formatting.",
    priority: "normal", status: "solved",
    requester_id: ORGS["Initech"].requester_id, submitter_id: ORGS["Initech"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Initech"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["export", "workaround", "analytics"],
    created_at: "2026-02-05T15:30:00Z", updated_at: "2026-02-06T11:00:00Z", due_at: null,
    via: { channel: "email" }, custom_fields: [],
    satisfaction_rating: { score: "bad" }, is_public: true, has_incidents: false,
  },
  {
    id: 35003, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35003.json",
    external_id: null, type: "question",
    subject: "Need CSV export for Q1 board deck — urgent",
    raw_subject: "Need CSV export for Q1 board deck — urgent",
    description: "Same request as our Canny vote — CSV export from analytics dashboard is blocking our Q1 board review.",
    priority: "high", status: "open",
    requester_id: ORGS["Acme Corp"].requester_id, submitter_id: ORGS["Acme Corp"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Acme Corp"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["csv", "export", "reporting"],
    created_at: "2026-02-01T08:45:00Z", updated_at: "2026-02-01T08:45:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },
  {
    id: 35004, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35004.json",
    external_id: null, type: "question",
    subject: "How to bulk download analytics data?",
    raw_subject: "How to bulk download analytics data?",
    description: "We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month.",
    priority: "normal", status: "open",
    requester_id: ORGS["Stark Industries"].requester_id, submitter_id: ORGS["Stark Industries"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Stark Industries"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["export", "analytics", "bulk"],
    created_at: "2026-01-28T11:20:00Z", updated_at: "2026-01-28T11:20:00Z", due_at: null,
    via: { channel: "email" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },
  {
    id: 35006, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35006.json",
    external_id: null, type: "question",
    subject: "Export feature request — voting on Canny too",
    raw_subject: "Export feature request — voting on Canny too",
    description: "Just wanted to flag that we also voted on the CSV export request on your Canny board. Would love to see this prioritized.",
    priority: "normal", status: "solved",
    requester_id: ORGS["Acme Corp"].requester_id, submitter_id: ORGS["Acme Corp"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Acme Corp"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["export", "feature-request"],
    created_at: "2026-01-15T16:00:00Z", updated_at: "2026-01-16T09:30:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },

  // Dashboard customization cluster (moderate signal)
  {
    id: 35007, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35007.json",
    external_id: null, type: "question",
    subject: "Can we hide metrics we don't use on the dashboard?",
    raw_subject: "Can we hide metrics we don't use on the dashboard?",
    description: "We're a 5-person team and most of the dashboard metrics aren't relevant to us. Would love to simplify the view.",
    priority: "normal", status: "open",
    requester_id: ORGS["Beta Inc"].requester_id, submitter_id: ORGS["Beta Inc"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Beta Inc"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["dashboard", "customization", "ux"],
    created_at: "2026-02-09T13:45:00Z", updated_at: "2026-02-09T13:45:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },
  {
    id: 35008, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35008.json",
    external_id: null, type: "question",
    subject: "Saved dashboard views for different teams",
    raw_subject: "Saved dashboard views for different teams",
    description: "Our data team and product team need completely different views. Having to scroll past irrelevant widgets wastes time.",
    priority: "normal", status: "open",
    requester_id: ORGS["Stark Industries"].requester_id, submitter_id: ORGS["Stark Industries"].requester_id,
    assignee_id: null, organization_id: ORGS["Stark Industries"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["dashboard", "customization", "teams"],
    created_at: "2026-02-03T10:00:00Z", updated_at: "2026-02-03T10:00:00Z", due_at: null,
    via: { channel: "email" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },
  {
    id: 35009, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35009.json",
    external_id: null, type: "question",
    subject: "Widget layout customization request",
    raw_subject: "Widget layout customization request",
    description: "Would be great to rearrange the dashboard widgets. Different teams care about different metrics.",
    priority: "low", status: "pending",
    requester_id: ORGS["Initech"].requester_id, submitter_id: ORGS["Initech"].requester_id,
    assignee_id: null, organization_id: ORGS["Initech"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["dashboard", "customization"],
    created_at: "2026-01-20T09:00:00Z", updated_at: "2026-01-20T09:00:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },

  // SSO cluster
  {
    id: 35005, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35005.json",
    external_id: null, type: "question",
    subject: "SSO timeline for Azure AD",
    raw_subject: "SSO timeline for Azure AD",
    description: "We're evaluating your platform for our 50-person engineering team. Azure AD SSO is a hard requirement. What's the timeline?",
    priority: "high", status: "pending",
    requester_id: ORGS["Globex Industries"].requester_id, submitter_id: ORGS["Globex Industries"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Globex Industries"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["sso", "azure", "roadmap"],
    created_at: "2026-02-10T08:30:00Z", updated_at: "2026-02-10T14:00:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },

  // Performance
  {
    id: 35010, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35010.json",
    external_id: null, type: "incident",
    subject: "Dashboard very slow with 6-month date range",
    raw_subject: "Dashboard very slow with 6-month date range",
    description: "Querying Jan–Jun takes ~15 seconds to load. Our team does annual reviews and this makes it painful.",
    priority: "normal", status: "open",
    requester_id: ORGS["Stark Industries"].requester_id, submitter_id: ORGS["Stark Industries"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Stark Industries"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["performance", "dashboard", "analytics"],
    created_at: "2026-02-11T17:00:00Z", updated_at: "2026-02-11T17:00:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: null, is_public: true, has_incidents: false,
  },

  // Noise — unrelated tickets
  {
    id: 35011, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35011.json",
    external_id: null, type: "problem",
    subject: "Password reset not working",
    raw_subject: "Password reset not working",
    description: "I requested a password reset but the email never arrived. Checked spam.",
    priority: "high", status: "solved",
    requester_id: ORGS["Beta Inc"].requester_id, submitter_id: ORGS["Beta Inc"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Beta Inc"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["auth", "bug"],
    created_at: "2026-02-12T12:00:00Z", updated_at: "2026-02-12T16:30:00Z", due_at: null,
    via: { channel: "email" }, custom_fields: [],
    satisfaction_rating: { score: "good" }, is_public: true, has_incidents: false,
  },
  {
    id: 35012, url: "https://acme-analytics.zendesk.com/api/v2/tickets/35012.json",
    external_id: null, type: "question",
    subject: "Billing question about seat count",
    raw_subject: "Billing question about seat count",
    description: "We removed 3 users last month. Will our next invoice reflect the reduced seat count?",
    priority: "low", status: "solved",
    requester_id: ORGS["Initech"].requester_id, submitter_id: ORGS["Initech"].requester_id,
    assignee_id: SUPPORT_AGENT_ID, organization_id: ORGS["Initech"].org_id,
    group_id: 98738, collaborator_ids: [], follower_ids: [],
    tags: ["billing", "seats"],
    created_at: "2026-02-07T10:00:00Z", updated_at: "2026-02-07T15:00:00Z", due_at: null,
    via: { channel: "web" }, custom_fields: [],
    satisfaction_rating: { score: "good" }, is_public: true, has_incidents: false,
  },
];

// Reverse lookup: ticket ID → organization name (for convenience in comments)
const TICKET_ORG_MAP = {};
for (const ticket of MOCK_TICKETS) {
  const orgName = Object.entries(ORGS).find(([, v]) => v.org_id === ticket.organization_id)?.[0] ?? "Unknown";
  TICKET_ORG_MAP[ticket.id] = orgName;
}

// Auto-incrementing comment IDs
let commentIdSeq = 100000;

/**
 * Ticket comments shaped to match Zendesk API v2 GET /api/v2/tickets/{id}/comments.json
 * @type {Record<number, z.infer<typeof ZendeskCommentSchema>[]>}
 */
const TICKET_COMMENTS = {
  35001: [
    { id: commentIdSeq++, type: "Comment", body: "We need this for board reporting. Currently screenshotting charts.", html_body: "<p>We need this for board reporting. Currently screenshotting charts.</p>", plain_body: "We need this for board reporting. Currently screenshotting charts.", public: true, author_id: ORGS["Acme Corp"].requester_id, attachments: [], created_at: "2026-02-08T09:15:00Z", via: { channel: "web" } },
    { id: commentIdSeq++, type: "Comment", body: "Adding urgency: board meeting is in 6 weeks. This is blocking our Q1 review.", html_body: "<p>Adding urgency: board meeting is in 6 weeks. This is blocking our Q1 review.</p>", plain_body: "Adding urgency: board meeting is in 6 weeks. This is blocking our Q1 review.", public: true, author_id: ORGS["Acme Corp"].requester_id, attachments: [], created_at: "2026-02-10T14:22:00Z", via: { channel: "web" } },
  ],
  35002: [
    { id: commentIdSeq++, type: "Comment", body: "Found a workaround using browser dev tools to copy table data, but it loses formatting. Not sustainable.", html_body: "<p>Found a workaround using browser dev tools to copy table data, but it loses formatting. Not sustainable.</p>", plain_body: "Found a workaround using browser dev tools to copy table data, but it loses formatting. Not sustainable.", public: true, author_id: ORGS["Initech"].requester_id, attachments: [], created_at: "2026-02-05T15:30:00Z", via: { channel: "email" } },
    { id: commentIdSeq++, type: "Comment", body: "Closed: provided dev-tools workaround. Customer notes this is not a long-term solution.", html_body: "<p>Closed: provided dev-tools workaround. Customer notes this is not a long-term solution.</p>", plain_body: "Closed: provided dev-tools workaround. Customer notes this is not a long-term solution.", public: false, author_id: SUPPORT_AGENT_ID, attachments: [], created_at: "2026-02-06T11:00:00Z", via: { channel: "web" } },
  ],
  35003: [
    { id: commentIdSeq++, type: "Comment", body: "Same as our Canny vote — CSV export from analytics dashboard is blocking our Q1 review.", html_body: "<p>Same as our Canny vote — CSV export from analytics dashboard is blocking our Q1 review.</p>", plain_body: "Same as our Canny vote — CSV export from analytics dashboard is blocking our Q1 review.", public: true, author_id: ORGS["Acme Corp"].requester_id, attachments: [], created_at: "2026-02-01T08:45:00Z", via: { channel: "web" } },
  ],
  35004: [
    { id: commentIdSeq++, type: "Comment", body: "We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month.", html_body: "<p>We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month.</p>", plain_body: "We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month.", public: true, author_id: ORGS["Stark Industries"].requester_id, attachments: [], created_at: "2026-01-28T11:20:00Z", via: { channel: "email" } },
  ],
  35007: [
    { id: commentIdSeq++, type: "Comment", body: "We're a 5-person team and most of the dashboard metrics aren't relevant to us. Would love to simplify the view.", html_body: "<p>We're a 5-person team and most of the dashboard metrics aren't relevant to us. Would love to simplify the view.</p>", plain_body: "We're a 5-person team and most of the dashboard metrics aren't relevant to us. Would love to simplify the view.", public: true, author_id: ORGS["Beta Inc"].requester_id, attachments: [], created_at: "2026-02-09T13:45:00Z", via: { channel: "web" } },
  ],
  35008: [
    { id: commentIdSeq++, type: "Comment", body: "Our data team and product team need completely different views. Having to scroll past irrelevant widgets wastes time.", html_body: "<p>Our data team and product team need completely different views. Having to scroll past irrelevant widgets wastes time.</p>", plain_body: "Our data team and product team need completely different views. Having to scroll past irrelevant widgets wastes time.", public: true, author_id: ORGS["Stark Industries"].requester_id, attachments: [], created_at: "2026-02-03T10:00:00Z", via: { channel: "email" } },
  ],
  35010: [
    { id: commentIdSeq++, type: "Comment", body: "Querying Jan–Jun takes ~15 seconds to load. Our team does annual reviews and this makes it painful.", html_body: "<p>Querying Jan–Jun takes ~15 seconds to load. Our team does annual reviews and this makes it painful.</p>", plain_body: "Querying Jan–Jun takes ~15 seconds to load. Our team does annual reviews and this makes it painful.", public: true, author_id: ORGS["Stark Industries"].requester_id, attachments: [], created_at: "2026-02-11T17:00:00Z", via: { channel: "web" } },
  ],
};

// ---------------------------------------------------------------------------
// Tools — same tool names as before, responses match Zendesk API v2 shapes
// ---------------------------------------------------------------------------

server.tool(
  "search_tickets",
  "Search Zendesk support tickets by tags, subject keywords, or company. Returns matching tickets with subject, tags, requester company, and status.",
  {
    tags: z.array(z.string()).optional().describe("Filter by ticket tags"),
    query: z.string().optional().describe("Search in subject/body"),
    company: z.string().optional().describe("Filter by requester company name"),
  },
  async ({ tags, query, company }) => {
    let results = [...MOCK_TICKETS];
    if (tags?.length) {
      const lower = tags.map((t) => t.toLowerCase());
      results = results.filter((r) =>
        r.tags.some((t) => lower.includes(t.toLowerCase())),
      );
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((r) =>
        r.subject.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
      );
    }
    if (company) {
      const c = company.toLowerCase();
      const orgEntry = Object.entries(ORGS).find(([name]) => name.toLowerCase().includes(c));
      if (orgEntry) {
        const orgId = orgEntry[1].org_id;
        results = results.filter((r) => r.organization_id === orgId);
      } else {
        results = [];
      }
    }

    // Add result_type for search results, matching Zendesk Search API format
    const resultsWithType = results.map((r) => ({ ...r, result_type: "ticket" }));

    // Mirror Zendesk API v2 GET /api/v2/search.json response envelope
    const response = {
      results: resultsWithType,
      facets: null,
      next_page: null,
      previous_page: null,
      count: resultsWithType.length,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
);

server.tool(
  "get_ticket_details",
  "Get full details for a support ticket including subject, description, tags, requester company, and status.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const ticketIdNum = parseInt(ticketId, 10);
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketIdNum);
    if (!ticket) {
      return { content: [{ type: "text", text: `Ticket ${ticketId} not found` }] };
    }

    // Mirror Zendesk API v2 GET /api/v2/tickets/{id}.json response envelope
    const response = {
      ticket,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
);

server.tool(
  "get_ticket_comments",
  "Get comments/thread for a support ticket.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const ticketIdNum = parseInt(ticketId, 10);
    const comments = TICKET_COMMENTS[ticketIdNum] || [];

    // Mirror Zendesk API v2 GET /api/v2/tickets/{id}/comments.json response envelope
    const response = {
      comments,
      next_page: null,
      previous_page: null,
      count: comments.length,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
