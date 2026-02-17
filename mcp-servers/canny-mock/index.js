#!/usr/bin/env node
/**
 * Canny Mock MCP Server
 *
 * Returns data shaped to match the real Canny API v1 response schemas.
 * Endpoints modeled:
 *   - POST /api/v1/posts/list       → search_feature_requests
 *   - POST /api/v1/posts/retrieve   → get_request_details
 *   - POST /api/v1/votes/list       → get_request_voters
 *
 * Reference: https://developers.canny.io/api-reference
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "canny-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Zod schemas — mirrors Canny API v1 response shapes
// ---------------------------------------------------------------------------

/** Canny API: Board object (embedded in post responses) */
const CannyBoardSchema = z.object({
  id: z.string(),
  created: z.string().datetime(),
  name: z.string(),
  postCount: z.number(),
  url: z.string().url(),
});

/** Canny API: Tag object */
const CannyTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  postCount: z.number(),
  url: z.string().url(),
});

/** Canny API: Category object */
const CannyCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  postCount: z.number(),
  url: z.string().url(),
});

/** Canny API: User object (author of a post or voter) */
const CannyUserSchema = z.object({
  id: z.string(),
  created: z.string().datetime(),
  email: z.string().email(),
  isAdmin: z.boolean(),
  name: z.string(),
  url: z.string().url(),
  userID: z.string().optional(),
  companies: z.array(z.object({
    id: z.string(),
    created: z.string(),
    name: z.string(),
    monthlySpend: z.number().optional(),
    customFields: z.record(z.unknown()).optional(),
  })).optional(),
});

/** Canny API: Post (feature request) object from POST /api/v1/posts/retrieve */
const CannyPostSchema = z.object({
  id: z.string(),
  author: CannyUserSchema,
  board: CannyBoardSchema,
  category: CannyCategorySchema.nullable(),
  changeComment: z.object({ value: z.string(), imageURLs: z.array(z.string()) }).nullable(),
  commentCount: z.number(),
  created: z.string().datetime(),
  customFields: z.array(z.object({ id: z.string(), name: z.string(), value: z.string() })),
  details: z.string(),
  eta: z.string().nullable(),
  imageURLs: z.array(z.string()),
  jira: z.object({ linkedIssues: z.array(z.object({ id: z.string(), key: z.string(), url: z.string() })) }).optional(),
  linear: z.object({ linkedIssueIDs: z.array(z.string()) }).optional(),
  mergeHistory: z.array(z.unknown()),
  owner: CannyUserSchema.nullable(),
  score: z.number().describe("Total vote score (upvotes minus downvotes)"),
  status: z.string(),
  statusChangedAt: z.string().datetime().nullable(),
  tags: z.array(CannyTagSchema),
  title: z.string(),
  url: z.string().url(),
});

/** Canny API: Vote object from POST /api/v1/votes/list */
const CannyVoteSchema = z.object({
  id: z.string(),
  board: CannyBoardSchema,
  by: CannyUserSchema.nullable(),
  created: z.string().datetime(),
  post: z.object({ id: z.string(), title: z.string() }),
  voter: CannyUserSchema,
});

// ---------------------------------------------------------------------------
// Shared mock objects
// ---------------------------------------------------------------------------

const MOCK_BOARD = {
  id: "553c3ef8b8cdcd1501ba1234",
  created: "2025-03-15T10:00:00.000Z",
  name: "Feature Requests",
  postCount: 87,
  url: "https://acme-analytics.canny.io/admin/board/feature-requests",
};

const TAG_MAP = {
  analytics: { id: "tag-001", name: "analytics", postCount: 24, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=analytics" },
  export: { id: "tag-002", name: "export", postCount: 18, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=export" },
  reporting: { id: "tag-003", name: "reporting", postCount: 12, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=reporting" },
  sso: { id: "tag-004", name: "sso", postCount: 5, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=sso" },
  security: { id: "tag-005", name: "security", postCount: 4, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=security" },
  enterprise: { id: "tag-006", name: "enterprise", postCount: 8, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=enterprise" },
  dashboard: { id: "tag-007", name: "dashboard", postCount: 15, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=dashboard" },
  ux: { id: "tag-008", name: "ux", postCount: 10, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=ux" },
  customization: { id: "tag-009", name: "customization", postCount: 9, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=customization" },
  performance: { id: "tag-010", name: "performance", postCount: 6, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=performance" },
  api: { id: "tag-011", name: "api", postCount: 7, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=api" },
  automation: { id: "tag-012", name: "automation", postCount: 3, url: "https://acme-analytics.canny.io/admin/board/feature-requests?tags=automation" },
};

// Voter companies mapped to Canny user objects
const VOTER_DB = {
  "Acme Corp": { id: "usr-acme", created: "2025-04-01T08:00:00.000Z", email: "jane@acmecorp.com", isAdmin: false, name: "Jane Smith", url: "https://acme-analytics.canny.io/admin/users/jane-smith", companies: [{ id: "comp-acme", created: "2025-03-01T00:00:00.000Z", name: "Acme Corp", monthlySpend: 12000 }] },
  "Initech": { id: "usr-initech", created: "2025-05-10T12:00:00.000Z", email: "david@initech.com", isAdmin: false, name: "David Kim", url: "https://acme-analytics.canny.io/admin/users/david-kim", companies: [{ id: "comp-initech", created: "2025-04-01T00:00:00.000Z", name: "Initech", monthlySpend: 3000 }] },
  "Stark Industries": { id: "usr-stark", created: "2025-06-20T09:00:00.000Z", email: "anna@stark.io", isAdmin: false, name: "Anna Reyes", url: "https://acme-analytics.canny.io/admin/users/anna-reyes", companies: [{ id: "comp-stark", created: "2025-05-01T00:00:00.000Z", name: "Stark Industries", monthlySpend: 25000 }] },
  "Beta Inc": { id: "usr-beta", created: "2025-07-15T14:00:00.000Z", email: "carlos@beta.dev", isAdmin: false, name: "Carlos Vega", url: "https://acme-analytics.canny.io/admin/users/carlos-vega", companies: [{ id: "comp-beta", created: "2025-06-01T00:00:00.000Z", name: "Beta Inc", monthlySpend: 500 }] },
  "Wayne Enterprises": { id: "usr-wayne", created: "2025-08-01T11:00:00.000Z", email: "bruce@wayne.com", isAdmin: false, name: "Bruce Wayne", url: "https://acme-analytics.canny.io/admin/users/bruce-wayne", companies: [{ id: "comp-wayne", created: "2025-07-01T00:00:00.000Z", name: "Wayne Enterprises", monthlySpend: 18000 }] },
  "Umbrella Corp": { id: "usr-umbrella", created: "2025-08-10T10:00:00.000Z", email: "alice@umbrella.co", isAdmin: false, name: "Alice Chen", url: "https://acme-analytics.canny.io/admin/users/alice-chen", companies: [{ id: "comp-umbrella", created: "2025-07-15T00:00:00.000Z", name: "Umbrella Corp", monthlySpend: 8000 }] },
  "Cyberdyne": { id: "usr-cyber", created: "2025-09-01T08:00:00.000Z", email: "miles@cyberdyne.io", isAdmin: false, name: "Miles Dyson", url: "https://acme-analytics.canny.io/admin/users/miles-dyson", companies: [{ id: "comp-cyber", created: "2025-08-01T00:00:00.000Z", name: "Cyberdyne", monthlySpend: 6000 }] },
  "Globex Industries": { id: "usr-globex", created: "2025-04-20T15:00:00.000Z", email: "tom@globex.com", isAdmin: false, name: "Tom Wilson", url: "https://acme-analytics.canny.io/admin/users/tom-wilson", companies: [{ id: "comp-globex", created: "2025-03-15T00:00:00.000Z", name: "Globex Industries", monthlySpend: 9000 }] },
};

// ---------------------------------------------------------------------------
// Mock posts — shaped to match Canny API v1 post objects
// ---------------------------------------------------------------------------

const MOCK_POSTS = [
  {
    id: "553c3ef8b8cdcd1501ba4001",
    author: VOTER_DB["Acme Corp"],
    board: MOCK_BOARD,
    category: { id: "cat-001", name: "Data & Reporting", postCount: 22, url: "https://acme-analytics.canny.io/admin/board/feature-requests?category=data-reporting" },
    changeComment: null,
    commentCount: 12,
    created: "2025-10-15T09:30:00.000Z",
    customFields: [],
    details: "Ability to select date range and metrics, then export all data as CSV for board reporting and external analysis. Many enterprise customers need this for quarterly reviews.",
    eta: "March 2026",
    imageURLs: [],
    mergeHistory: [],
    owner: null,
    score: 47,
    status: "under review",
    statusChangedAt: "2026-01-10T14:00:00.000Z",
    tags: [TAG_MAP.analytics, TAG_MAP.export, TAG_MAP.reporting],
    title: "Bulk CSV export from analytics dashboard",
    url: "https://acme-analytics.canny.io/admin/board/feature-requests/p/bulk-csv-export-from-analytics-dashboard",
    _voterCompanies: ["Acme Corp", "Initech", "Stark Industries", "Beta Inc", "Wayne Enterprises", "Umbrella Corp", "Cyberdyne"],
  },
  {
    id: "553c3ef8b8cdcd1501ba4002",
    author: VOTER_DB["Globex Industries"],
    board: MOCK_BOARD,
    category: { id: "cat-002", name: "Security & Identity", postCount: 8, url: "https://acme-analytics.canny.io/admin/board/feature-requests?category=security-identity" },
    changeComment: null,
    commentCount: 8,
    created: "2025-09-01T11:00:00.000Z",
    customFields: [],
    details: "Native SSO with Azure AD and SAML 2.0 for enterprise identity. Critical for regulated industries. Many large prospects list this as a hard requirement.",
    eta: null,
    imageURLs: [],
    mergeHistory: [],
    owner: null,
    score: 23,
    status: "planned",
    statusChangedAt: "2025-12-05T10:00:00.000Z",
    tags: [TAG_MAP.sso, TAG_MAP.security, TAG_MAP.enterprise],
    title: "Azure AD / SAML SSO support",
    url: "https://acme-analytics.canny.io/admin/board/feature-requests/p/azure-ad-saml-sso-support",
    _voterCompanies: ["Globex Industries", "Umbrella Corp", "Cyberdyne"],
  },
  {
    id: "553c3ef8b8cdcd1501ba4003",
    author: VOTER_DB["Stark Industries"],
    board: MOCK_BOARD,
    category: { id: "cat-003", name: "Dashboard", postCount: 15, url: "https://acme-analytics.canny.io/admin/board/feature-requests?category=dashboard" },
    changeComment: null,
    commentCount: 9,
    created: "2025-11-20T16:00:00.000Z",
    customFields: [],
    details: "Allow users to customize widget layout, select which metrics appear, and save views per workspace or team. Different teams need different perspectives on the same data.",
    eta: null,
    imageURLs: [],
    mergeHistory: [],
    owner: null,
    score: 31,
    status: "under review",
    statusChangedAt: "2026-01-15T09:00:00.000Z",
    tags: [TAG_MAP.analytics, TAG_MAP.dashboard, TAG_MAP.ux, TAG_MAP.customization],
    title: "Dashboard customization and saved views",
    url: "https://acme-analytics.canny.io/admin/board/feature-requests/p/dashboard-customization-and-saved-views",
    _voterCompanies: ["Acme Corp", "Initech", "Beta Inc", "Stark Industries", "Wayne Enterprises"],
  },
  {
    id: "553c3ef8b8cdcd1501ba4004",
    author: VOTER_DB["Stark Industries"],
    board: MOCK_BOARD,
    category: { id: "cat-003", name: "Dashboard", postCount: 15, url: "https://acme-analytics.canny.io/admin/board/feature-requests?category=dashboard" },
    changeComment: null,
    commentCount: 4,
    created: "2026-01-05T13:00:00.000Z",
    customFields: [],
    details: "Dashboard becomes noticeably slow when querying data beyond 90 days. Need performance improvements for long time ranges, especially for annual reviews.",
    eta: null,
    imageURLs: [],
    mergeHistory: [],
    owner: null,
    score: 14,
    status: "under review",
    statusChangedAt: null,
    tags: [TAG_MAP.performance, TAG_MAP.analytics, TAG_MAP.dashboard],
    title: "Faster queries for 90+ day date ranges",
    url: "https://acme-analytics.canny.io/admin/board/feature-requests/p/faster-queries-for-90-day-date-ranges",
    _voterCompanies: ["Stark Industries", "Acme Corp"],
  },
  {
    id: "553c3ef8b8cdcd1501ba4005",
    author: VOTER_DB["Initech"],
    board: MOCK_BOARD,
    category: { id: "cat-001", name: "Data & Reporting", postCount: 22, url: "https://acme-analytics.canny.io/admin/board/feature-requests?category=data-reporting" },
    changeComment: null,
    commentCount: 6,
    created: "2025-12-10T10:30:00.000Z",
    customFields: [],
    details: "Allow scheduling recurring exports (daily, weekly, monthly) that run automatically and deliver CSV to email or webhook. Reduces manual work for teams that need regular reports.",
    eta: null,
    imageURLs: [],
    mergeHistory: [],
    owner: null,
    score: 18,
    status: "under review",
    statusChangedAt: null,
    tags: [TAG_MAP.export, TAG_MAP.api, TAG_MAP.automation, TAG_MAP.reporting],
    title: "Scheduled / automated CSV export via API",
    url: "https://acme-analytics.canny.io/admin/board/feature-requests/p/scheduled-automated-csv-export-via-api",
    _voterCompanies: ["Acme Corp", "Stark Industries", "Initech"],
  },
];

// ---------------------------------------------------------------------------
// Tools — same tool names as before, responses match Canny API v1 shapes
// ---------------------------------------------------------------------------

server.tool(
  "search_feature_requests",
  "Search Canny feature requests by keywords or tags. Returns list of requests with vote counts and status.",
  {
    keywords: z.array(z.string()).optional().describe("Keywords to search in title/description"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
  },
  async ({ keywords, tags }) => {
    let results = [...MOCK_POSTS];
    if (keywords?.length) {
      const lower = keywords.map((k) => k.toLowerCase());
      results = results.filter(
        (r) =>
          lower.some((k) => r.title.toLowerCase().includes(k)) ||
          lower.some((k) => r.details.toLowerCase().includes(k)),
      );
    }
    if (tags?.length) {
      const lower = tags.map((t) => t.toLowerCase());
      results = results.filter((r) =>
        r.tags.some((t) => lower.includes(t.name.toLowerCase())),
      );
    }

    // Mirror Canny API v1 POST /api/v1/posts/list response envelope
    // Strip internal _voterCompanies from list results
    const posts = results.map(({ _voterCompanies, ...post }) => post);
    const response = {
      hasMore: false,
      posts,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
);

server.tool(
  "get_request_details",
  "Get full details for a specific feature request including description, votes, status, and voter companies.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    const req = MOCK_POSTS.find((r) => r.id === requestId);
    if (!req) {
      return { content: [{ type: "text", text: `Request ${requestId} not found` }] };
    }

    // Mirror Canny API v1 POST /api/v1/posts/retrieve — returns the full post object
    const { _voterCompanies, ...post } = req;
    return { content: [{ type: "text", text: JSON.stringify(post, null, 2) }] };
  },
);

server.tool(
  "get_request_voters",
  "Get companies (and optionally count) that voted for a feature request.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    const req = MOCK_POSTS.find((r) => r.id === requestId);
    if (!req) {
      return { content: [{ type: "text", text: `Request ${requestId} not found` }] };
    }

    // Mirror Canny API v1 POST /api/v1/votes/list — returns vote objects with voter details
    const votes = req._voterCompanies.map((companyName, idx) => {
      const voter = VOTER_DB[companyName];
      if (!voter) return null;
      return {
        id: `vote-${req.id}-${idx}`,
        board: MOCK_BOARD,
        by: null,
        created: new Date(Date.parse(req.created) + idx * 86400000).toISOString(),
        post: { id: req.id, title: req.title },
        voter,
      };
    }).filter(Boolean);

    const response = {
      hasMore: false,
      votes,
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
