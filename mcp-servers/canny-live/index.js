#!/usr/bin/env node
/**
 * Canny Live MCP Server
 *
 * Drop-in replacement for canny-mock — same tool names, same Zod input schemas,
 * same Canny API v1 response shapes. The only difference: this one calls the
 * real Canny REST API instead of returning hardcoded data.
 *
 * Requires CANNY_API_KEY env var (find yours at https://canny.io → Settings → API).
 *
 * Endpoints called:
 *   POST https://canny.io/api/v1/posts/list      → search_feature_requests
 *   POST https://canny.io/api/v1/posts/retrieve   → get_request_details
 *   POST https://canny.io/api/v1/votes/list       → get_request_voters
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CANNY_API_KEY = process.env.CANNY_API_KEY;
if (!CANNY_API_KEY) {
  console.error("Error: CANNY_API_KEY environment variable is required.");
  console.error("Get yours from https://canny.io → Settings → API");
  process.exit(1);
}

const CANNY_BASE = "https://canny.io/api/v1";

/**
 * Helper: POST to a Canny API endpoint with the apiKey and optional body params.
 * Returns the parsed JSON response.
 */
async function cannyRequest(path, params = {}) {
  const response = await fetch(`${CANNY_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: CANNY_API_KEY, ...params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Canny API ${path} returned ${response.status}: ${text}`);
  }

  return response.json();
}

const server = new McpServer({
  name: "canny-live",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: search_feature_requests
// Mirrors: POST /api/v1/posts/list
// ---------------------------------------------------------------------------

server.tool(
  "search_feature_requests",
  "Search Canny feature requests by keywords or tags. Returns list of requests with vote counts and status.",
  {
    keywords: z.array(z.string()).optional().describe("Keywords to search in title/description"),
    tags: z.array(z.string()).optional().describe("Filter by tags"),
  },
  async ({ keywords, tags }) => {
    try {
      // Canny's /posts/list supports search, tagList, and sort
      const params = {
        limit: 50,
        sort: "score",
      };

      // Canny v1 posts/list supports a "search" param for keyword filtering
      if (keywords?.length) {
        params.search = keywords.join(" ");
      }

      const data = await cannyRequest("/posts/list", params);

      // If tags were provided, filter client-side (Canny's API filters by
      // single tagList, not multiple tags with OR logic)
      let posts = data.posts || [];
      if (tags?.length) {
        const lowerTags = tags.map((t) => t.toLowerCase());
        posts = posts.filter((post) =>
          (post.tags || []).some((tag) =>
            lowerTags.includes((tag.name || tag).toLowerCase())
          )
        );
      }

      const response = {
        hasMore: data.hasMore || false,
        posts,
      };

      return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Canny API error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_request_details
// Mirrors: POST /api/v1/posts/retrieve
// ---------------------------------------------------------------------------

server.tool(
  "get_request_details",
  "Get full details for a specific feature request including description, votes, status, and voter companies.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    try {
      const data = await cannyRequest("/posts/retrieve", { id: requestId });

      // The Canny API returns the post object directly (not wrapped)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Canny API error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: get_request_voters
// Mirrors: POST /api/v1/votes/list
// ---------------------------------------------------------------------------

server.tool(
  "get_request_voters",
  "Get companies (and optionally count) that voted for a feature request.",
  { requestId: z.string().describe("The Canny feature request ID") },
  async ({ requestId }) => {
    try {
      const data = await cannyRequest("/votes/list", {
        postID: requestId,
        limit: 100,
      });

      const response = {
        hasMore: data.hasMore || false,
        votes: data.votes || [],
      };

      return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Canny API error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: create_post
// Mirrors: POST /api/v1/posts/create
// ---------------------------------------------------------------------------

server.tool(
  "create_post",
  "Create a new feature request post on a Canny board. Requires a board ID and author ID.",
  {
    boardID: z.string().describe("The board ID to create the post on"),
    authorID: z.string().describe("The Canny user ID of the post author"),
    title: z.string().describe("Title of the feature request"),
    details: z.string().optional().describe("Detailed description of the feature request"),
  },
  async ({ boardID, authorID, title, details }) => {
    try {
      const params = { boardID, authorID, title };
      if (details) params.details = details;

      const data = await cannyRequest("/posts/create", params);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Canny API error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ---------------------------------------------------------------------------
// Tool: list_boards
// Mirrors: POST /api/v1/boards/list
// ---------------------------------------------------------------------------

server.tool(
  "list_boards",
  "List all Canny boards. Useful for finding the board ID needed to create posts.",
  {},
  async () => {
    try {
      const data = await cannyRequest("/boards/list");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Canny API error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
