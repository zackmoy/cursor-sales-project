#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "zendesk-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Mock data — multiple themes, varied urgency and status
// ---------------------------------------------------------------------------

const MOCK_TICKETS = [
  // Export / CSV cluster (strong signal)
  { id: "zd-001", subject: "Is there any way to export the monthly analytics as a CSV?", requesterCompany: "Acme Corp", tags: ["export", "csv", "reporting"], createdAt: "2026-02-08", status: "open", priority: "high" },
  { id: "zd-002", subject: "Workaround for getting dashboard data into Excel", requesterCompany: "Initech", tags: ["export", "workaround", "analytics"], createdAt: "2026-02-05", status: "solved", priority: "normal" },
  { id: "zd-003", subject: "Need CSV export for Q1 board deck — urgent", requesterCompany: "Acme Corp", tags: ["csv", "export", "reporting"], createdAt: "2026-02-01", status: "open", priority: "high" },
  { id: "zd-004", subject: "How to bulk download analytics data?", requesterCompany: "Stark Industries", tags: ["export", "analytics", "bulk"], createdAt: "2026-01-28", status: "open", priority: "normal" },
  { id: "zd-006", subject: "Export feature request — voting on Canny too", requesterCompany: "Acme Corp", tags: ["export", "feature-request"], createdAt: "2026-01-15", status: "solved", priority: "normal" },

  // Dashboard customization cluster (moderate signal)
  { id: "zd-007", subject: "Can we hide metrics we don't use on the dashboard?", requesterCompany: "Beta Inc", tags: ["dashboard", "customization", "ux"], createdAt: "2026-02-09", status: "open", priority: "normal" },
  { id: "zd-008", subject: "Saved dashboard views for different teams", requesterCompany: "Stark Industries", tags: ["dashboard", "customization", "teams"], createdAt: "2026-02-03", status: "open", priority: "normal" },
  { id: "zd-009", subject: "Widget layout customization request", requesterCompany: "Initech", tags: ["dashboard", "customization"], createdAt: "2026-01-20", status: "pending", priority: "low" },

  // SSO cluster (niche but strong for specific prospect)
  { id: "zd-005", subject: "SSO timeline for Azure AD", requesterCompany: "Globex Industries", tags: ["sso", "azure", "roadmap"], createdAt: "2026-02-10", status: "pending", priority: "high" },

  // Performance (single signal)
  { id: "zd-010", subject: "Dashboard very slow with 6-month date range", requesterCompany: "Stark Industries", tags: ["performance", "dashboard", "analytics"], createdAt: "2026-02-11", status: "open", priority: "normal" },

  // Noise — unrelated tickets
  { id: "zd-011", subject: "Password reset not working", requesterCompany: "Beta Inc", tags: ["auth", "bug"], createdAt: "2026-02-12", status: "solved", priority: "high" },
  { id: "zd-012", subject: "Billing question about seat count", requesterCompany: "Initech", tags: ["billing", "seats"], createdAt: "2026-02-07", status: "solved", priority: "low" },
];

const TICKET_COMMENTS = {
  "zd-001": [
    { body: "We need this for board reporting. Currently screenshotting charts.", author: "Jane Smith", createdAt: "2026-02-08" },
    { body: "Adding urgency: board meeting is in 6 weeks. This is blocking our Q1 review.", author: "Jane Smith", createdAt: "2026-02-10" },
  ],
  "zd-002": [
    { body: "Found a workaround using browser dev tools to copy table data, but it loses formatting. Not sustainable.", author: "David Kim", createdAt: "2026-02-05" },
    { body: "Closed: provided dev-tools workaround. Customer notes this is not a long-term solution.", author: "Support", createdAt: "2026-02-06" },
  ],
  "zd-003": [
    { body: "Same as our Canny vote — CSV export from analytics dashboard is blocking our Q1 review.", author: "Jane Smith", createdAt: "2026-02-01" },
  ],
  "zd-004": [
    { body: "We have 500 seats and need to pull data for multiple business units. A bulk export option would save our data team hours each month.", author: "James Obi", createdAt: "2026-01-28" },
  ],
  "zd-007": [
    { body: "We're a 5-person team and most of the dashboard metrics aren't relevant to us. Would love to simplify the view.", author: "Carlos Vega", createdAt: "2026-02-09" },
  ],
  "zd-008": [
    { body: "Our data team and product team need completely different views. Having to scroll past irrelevant widgets wastes time.", author: "Anna Reyes", createdAt: "2026-02-03" },
  ],
  "zd-010": [
    { body: "Querying Jan–Jun takes ~15 seconds to load. Our team does annual reviews and this makes it painful.", author: "James Obi", createdAt: "2026-02-11" },
  ],
};

// ---------------------------------------------------------------------------
// Tools
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
      results = results.filter((r) => r.subject.toLowerCase().includes(q));
    }
    if (company) {
      const c = company.toLowerCase();
      results = results.filter((r) =>
        r.requesterCompany.toLowerCase().includes(c),
      );
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
);

server.tool(
  "get_ticket_details",
  "Get full details for a support ticket including subject, description, tags, requester company, and status.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
    if (!ticket)
      return {
        content: [{ type: "text", text: `Ticket ${ticketId} not found` }],
      };
    const comments = TICKET_COMMENTS[ticketId] || [];
    return {
      content: [
        { type: "text", text: JSON.stringify({ ...ticket, comments }, null, 2) },
      ],
    };
  },
);

server.tool(
  "get_ticket_comments",
  "Get comments/thread for a support ticket.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const comments = TICKET_COMMENTS[ticketId] || [];
    return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
