#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "canny-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Mock data — varied request types, vote counts, and voter companies
// ---------------------------------------------------------------------------

const MOCK_REQUESTS = [
  {
    id: "req-csv-001",
    title: "Bulk CSV export from analytics dashboard",
    description:
      "Ability to select date range and metrics, then export all data as CSV for board reporting and external analysis. Many enterprise customers need this for quarterly reviews.",
    voteCount: 47,
    status: "Under Consideration",
    createdAt: "2025-10-15",
    tags: ["analytics", "export", "reporting"],
    voterCompanies: [
      "Acme Corp",
      "Initech",
      "Stark Industries",
      "Beta Inc",
      "Wayne Enterprises",
      "Umbrella Corp",
      "Cyberdyne",
    ],
    commentCount: 12,
  },
  {
    id: "req-sso-002",
    title: "Azure AD / SAML SSO support",
    description:
      "Native SSO with Azure AD and SAML 2.0 for enterprise identity. Critical for regulated industries. Many large prospects list this as a hard requirement.",
    voteCount: 23,
    status: "Planned",
    createdAt: "2025-09-01",
    tags: ["sso", "security", "enterprise"],
    voterCompanies: ["Globex Industries", "Umbrella Corp", "Cyberdyne"],
    commentCount: 8,
  },
  {
    id: "req-dash-003",
    title: "Dashboard customization and saved views",
    description:
      "Allow users to customize widget layout, select which metrics appear, and save views per workspace or team. Different teams need different perspectives on the same data.",
    voteCount: 31,
    status: "Under Consideration",
    createdAt: "2025-11-20",
    tags: ["analytics", "dashboard", "ux", "customization"],
    voterCompanies: [
      "Acme Corp",
      "Initech",
      "Beta Inc",
      "Stark Industries",
      "Wayne Enterprises",
    ],
    commentCount: 9,
  },
  {
    id: "req-perf-004",
    title: "Faster queries for 90+ day date ranges",
    description:
      "Dashboard becomes noticeably slow when querying data beyond 90 days. Need performance improvements for long time ranges, especially for annual reviews.",
    voteCount: 14,
    status: "Under Consideration",
    createdAt: "2026-01-05",
    tags: ["performance", "analytics", "dashboard"],
    voterCompanies: ["Stark Industries", "Acme Corp"],
    commentCount: 4,
  },
  {
    id: "req-api-005",
    title: "Scheduled / automated CSV export via API",
    description:
      "Allow scheduling recurring exports (daily, weekly, monthly) that run automatically and deliver CSV to email or webhook. Reduces manual work for teams that need regular reports.",
    voteCount: 18,
    status: "Under Consideration",
    createdAt: "2025-12-10",
    tags: ["export", "api", "automation", "reporting"],
    voterCompanies: ["Acme Corp", "Stark Industries", "Initech"],
    commentCount: 6,
  },
];

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.tool(
  "search_feature_requests",
  "Search Canny feature requests by keywords or tags. Returns list of requests with vote counts and status.",
  {
    keywords: z
      .array(z.string())
      .optional()
      .describe("Keywords to search in title/description"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
  },
  async ({ keywords, tags }) => {
    let results = [...MOCK_REQUESTS];
    if (keywords?.length) {
      const lower = keywords.map((k) => k.toLowerCase());
      results = results.filter(
        (r) =>
          lower.some((k) => r.title.toLowerCase().includes(k)) ||
          lower.some((k) => r.description.toLowerCase().includes(k)),
      );
    }
    if (tags?.length) {
      const lower = tags.map((t) => t.toLowerCase());
      results = results.filter((r) =>
        r.tags.some((t) => lower.includes(t.toLowerCase())),
      );
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
);

server.tool(
  "get_request_details",
  "Get full details for a specific feature request including description, votes, status, and voter companies.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    const req = MOCK_REQUESTS.find((r) => r.id === requestId);
    if (!req)
      return {
        content: [{ type: "text", text: `Request ${requestId} not found` }],
      };
    return { content: [{ type: "text", text: JSON.stringify(req, null, 2) }] };
  },
);

server.tool(
  "get_request_voters",
  "Get companies (and optionally count) that voted for a feature request.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    const req = MOCK_REQUESTS.find((r) => r.id === requestId);
    if (!req)
      return {
        content: [{ type: "text", text: `Request ${requestId} not found` }],
      };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              requestId,
              voteCount: req.voteCount,
              companies: req.voterCompanies,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
