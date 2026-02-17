#!/usr/bin/env node
/**
 * Seed script: pushes all mock feedback data into a real Canny board.
 *
 * Usage:
 *   CANNY_API_KEY=your_key node seed.js
 *
 * What it does:
 *   1. Lists your boards → finds "Feature Requests" (or first board)
 *   2. Creates/updates users for each voter persona (with company data)
 *   3. Creates posts matching the mock data (title, details, status)
 *   4. Adds votes from the appropriate users on each post
 *
 * Safe to run multiple times — Canny deduplicates users by userID and
 * votes by (voter, post). Posts with the same title will be created again
 * though, so only run once on a fresh board.
 */

const CANNY_API_KEY = process.env.CANNY_API_KEY;
if (!CANNY_API_KEY) {
  console.error("Error: CANNY_API_KEY environment variable is required.");
  console.error("Usage: CANNY_API_KEY=your_key node seed.js");
  process.exit(1);
}

const CANNY_BASE = "https://canny.io/api/v1";

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

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// ---------------------------------------------------------------------------
// Mock data to seed — matches what's in canny-mock/index.js
// ---------------------------------------------------------------------------

const USERS = [
  { userID: "user-jane", name: "Jane Smith", email: "jane@acmecorp.com", company: { id: "comp-acme", name: "Acme Corp", monthlySpend: 12000 } },
  { userID: "user-david", name: "David Kim", email: "david@initech.com", company: { id: "comp-initech", name: "Initech", monthlySpend: 3000 } },
  { userID: "user-anna", name: "Anna Reyes", email: "anna@stark.io", company: { id: "comp-stark", name: "Stark Industries", monthlySpend: 25000 } },
  { userID: "user-carlos", name: "Carlos Vega", email: "carlos@beta.dev", company: { id: "comp-beta", name: "Beta Inc", monthlySpend: 500 } },
  { userID: "user-bruce", name: "Bruce Wayne", email: "bruce@wayne.com", company: { id: "comp-wayne", name: "Wayne Enterprises", monthlySpend: 18000 } },
  { userID: "user-alice", name: "Alice Chen", email: "alice@umbrella.co", company: { id: "comp-umbrella", name: "Umbrella Corp", monthlySpend: 8000 } },
  { userID: "user-miles", name: "Miles Dyson", email: "miles@cyberdyne.io", company: { id: "comp-cyber", name: "Cyberdyne", monthlySpend: 6000 } },
  { userID: "user-tom", name: "Tom Wilson", email: "tom@globex.com", company: { id: "comp-globex", name: "Globex Industries", monthlySpend: 9000 } },
];

const POSTS = [
  {
    title: "Bulk CSV export from analytics dashboard",
    details: "Ability to select date range and metrics, then export all data as CSV for board reporting and external analysis. Many enterprise customers need this for quarterly reviews.",
    authorUserID: "user-jane",
    voterUserIDs: ["user-jane", "user-david", "user-anna", "user-carlos", "user-bruce", "user-alice", "user-miles"],
  },
  {
    title: "Azure AD / SAML SSO support",
    details: "Native SSO with Azure AD and SAML 2.0 for enterprise identity. Critical for regulated industries. Many large prospects list this as a hard requirement.",
    authorUserID: "user-tom",
    voterUserIDs: ["user-tom", "user-alice", "user-miles"],
  },
  {
    title: "Dashboard customization and saved views",
    details: "Allow users to customize widget layout, select which metrics appear, and save views per workspace or team. Different teams need different perspectives on the same data.",
    authorUserID: "user-anna",
    voterUserIDs: ["user-jane", "user-david", "user-carlos", "user-anna", "user-bruce"],
  },
  {
    title: "Faster queries for 90+ day date ranges",
    details: "Dashboard becomes noticeably slow when querying data beyond 90 days. Need performance improvements for long time ranges, especially for annual reviews.",
    authorUserID: "user-anna",
    voterUserIDs: ["user-anna", "user-jane"],
  },
  {
    title: "Scheduled / automated CSV export via API",
    details: "Allow scheduling recurring exports (daily, weekly, monthly) that run automatically and deliver CSV to email or webhook. Reduces manual work for teams that need regular reports.",
    authorUserID: "user-david",
    voterUserIDs: ["user-jane", "user-anna", "user-david"],
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Canny Seed Script ===\n");

  // 1. Find the board
  console.log("1. Finding board...");
  const boardsData = await cannyRequest("/boards/list");
  const boards = boardsData.boards || [];

  if (boards.length === 0) {
    console.error("No boards found. Create a board in Canny first (e.g. 'Feature Requests').");
    process.exit(1);
  }

  // Prefer "Feature Requests" board, fall back to first
  const board = boards.find((b) => b.name.toLowerCase().includes("feature")) || boards[0];
  console.log(`   Using board: "${board.name}" (${board.id})\n`);

  // 2. Create/update users
  console.log("2. Creating users...");
  const userIdMap = {}; // userID → Canny internal ID

  for (const user of USERS) {
    const result = await cannyRequest("/users/create_or_update", {
      userID: user.userID,
      name: user.name,
      email: user.email,
      companies: [user.company],
    });
    userIdMap[user.userID] = result.id;
    console.log(`   Created/updated: ${user.name} (${user.company.name}) → ${result.id}`);
  }
  console.log();

  // 3. Create posts
  console.log("3. Creating posts...");
  const postIds = [];

  for (const post of POSTS) {
    const authorCannyId = userIdMap[post.authorUserID];
    const result = await cannyRequest("/posts/create", {
      authorID: authorCannyId,
      boardID: board.id,
      title: post.title,
      details: post.details,
    });
    postIds.push({ ...post, cannyPostId: result.id });
    console.log(`   Created: "${post.title}" → ${result.id}`);
  }
  console.log();

  // 4. Add votes
  console.log("4. Adding votes...");
  let voteCount = 0;

  for (const post of postIds) {
    for (const voterUserID of post.voterUserIDs) {
      const voterCannyId = userIdMap[voterUserID];

      // Skip the author — Canny auto-votes for them on creation
      if (voterUserID === post.authorUserID) continue;

      try {
        await cannyRequest("/votes/create", {
          postID: post.cannyPostId,
          voterID: voterCannyId,
        });
        voteCount++;
      } catch (err) {
        // Canny returns an error if the user already voted; safe to ignore
        if (!err.message.includes("already voted")) {
          console.warn(`   Warning: vote failed for ${voterUserID} on "${post.title}": ${err.message}`);
        }
      }
    }
    const totalVoters = post.voterUserIDs.length;
    console.log(`   Votes on "${post.title}": ${totalVoters} voters`);
  }

  console.log(`\n=== Done! Created ${USERS.length} users, ${postIds.length} posts, ${voteCount} votes ===`);
  console.log(`\nView your board: ${board.url}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
