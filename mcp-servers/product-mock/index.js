#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "product-server-mock",
  version: "1.0.0",
});

const MOCK_CUSTOMERS = {
  "jane@acmecorp.com": {
    customerId: "cust-acme-001",
    company: "Acme Corp",
    tier: "Enterprise",
    seats: 150,
    features: ["analytics-dashboard", "api-access", "sso-saml", "custom-reports"],
    ae: { name: "Mike Chen", email: "mike@ourcompany.com", github: "mike-chen" },
    se: { name: "Sarah Lee", email: "sarah@ourcompany.com", github: "sarah-lee" },
    status: "active",
    renewalDate: "2026-09-01",
  },
};

server.tool(
  "lookup_customer",
  "Look up a customer account by email address. Returns tier, features, assigned AE/SE, and account status.",
  { email: z.string().describe("Email address of the contact") },
  async ({ email }) => {
    const customer = MOCK_CUSTOMERS[email];
    if (!customer) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            found: false,
            status: "prospect",
            message: `No customer account found for ${email}. This person is likely a prospect.`,
          }, null, 2),
        }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify({ found: true, ...customer }, null, 2) }] };
  }
);

server.tool(
  "verify_feature_compatibility",
  "Check if a proposed feature is compatible with a customer's current tier and configuration.",
  {
    customerId: z.string().describe("Customer ID"),
    featureName: z.string().describe("Name of the proposed feature"),
    featureDescription: z.string().describe("Brief description of what the feature does"),
  },
  async ({ customerId, featureName }) => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          compatible: true,
          customerId,
          feature: featureName,
          tier: "Enterprise",
          notes: "Feature is compatible with Enterprise tier. No additional configuration required. Customer has API access enabled which supports the export endpoint.",
        }, null, 2),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
