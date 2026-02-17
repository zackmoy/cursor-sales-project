#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "zendesk-mock",
  version: "1.0.0",
});

const MOCK_TICKETS = [
  { id: "zd-001", subject: "Is there any way to export the monthly analytics as a CSV?", requesterCompany: "Acme Corp", tags: ["export", "csv", "reporting"], createdAt: "2026-02-08", status: "open" },
  { id: "zd-002", subject: "Workaround for getting dashboard data into Excel", requesterCompany: "Initech", tags: ["export", "workaround", "analytics"], createdAt: "2026-02-05", status: "solved" },
  { id: "zd-003", subject: "Need CSV export for Q1 board deck", requesterCompany: "Acme Corp", tags: ["csv", "export", "reporting"], createdAt: "2026-02-01", status: "open" },
  { id: "zd-004", subject: "How to bulk download analytics data?", requesterCompany: "Stark Industries", tags: ["export", "analytics", "bulk"], createdAt: "2026-01-28", status: "open" },
  { id: "zd-005", subject: "SSO timeline for Azure AD", requesterCompany: "Globex Industries", tags: ["sso", "azure", "roadmap"], createdAt: "2026-02-10", status: "pending" },
  { id: "zd-006", subject: "Export feature request - voting on Canny too", requesterCompany: "Acme Corp", tags: ["export", "feature-request"], createdAt: "2026-01-15", status: "solved" },
];

const TICKET_COMMENTS = {
  "zd-001": [
    { body: "We need this for board reporting. Currently screenshotting charts.", author: "Jane Smith", createdAt: "2026-02-08" },
  ],
  "zd-003": [
    { body: "Same as our Canny vote - CSV export from analytics dashboard is blocking our Q1 review.", author: "Support", createdAt: "2026-02-01" },
  ],
};

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
      results = results.filter((r) => r.tags.some((t) => lower.includes(t.toLowerCase())));
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((r) => r.subject.toLowerCase().includes(q));
    }
    if (company) {
      const c = company.toLowerCase();
      results = results.filter((r) => r.requesterCompany.toLowerCase().includes(c));
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "get_ticket_details",
  "Get full details for a support ticket including subject, description, tags, requester company, and status.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
    if (!ticket) return { content: [{ type: "text", text: `Ticket ${ticketId} not found` }] };
    const comments = TICKET_COMMENTS[ticketId] || [];
    return { content: [{ type: "text", text: JSON.stringify({ ...ticket, comments }, null, 2) }] };
  }
);

server.tool(
  "get_ticket_comments",
  "Get comments/thread for a support ticket.",
  { ticketId: z.string().describe("The Zendesk ticket ID") },
  async ({ ticketId }) => {
    const comments = TICKET_COMMENTS[ticketId] || [];
    return { content: [{ type: "text", text: JSON.stringify(comments, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
