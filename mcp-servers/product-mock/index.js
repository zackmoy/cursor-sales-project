#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "product-server-mock",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Mock customer database — multiple tiers, varied feature sets
// ---------------------------------------------------------------------------

const MOCK_CUSTOMERS = {
  "jane@acmecorp.com": {
    customerId: "cust-acme-001",
    company: "Acme Corp",
    tier: "Enterprise",
    seats: 150,
    features: [
      "analytics-dashboard",
      "api-access",
      "sso-saml",
      "custom-reports",
      "data-export",
      "bulk-operations",
    ],
    ae: { name: "Mike Chen", email: "mike@ourcompany.com", github: "mike-chen" },
    se: { name: "Sarah Lee", email: "sarah@ourcompany.com", github: "sarah-lee" },
    status: "active",
    renewalDate: "2026-09-01",
    config: {
      maxExportRows: 1_000_000,
      retentionDays: 365,
      customBranding: true,
    },
  },
  "david@initech.com": {
    customerId: "cust-initech-002",
    company: "Initech",
    tier: "Pro",
    seats: 25,
    features: ["analytics-dashboard", "api-access"],
    ae: { name: "Lisa Park", email: "lisa@ourcompany.com", github: "lisa-park" },
    se: null,
    status: "active",
    renewalDate: "2026-06-15",
    config: {
      maxExportRows: 10_000,
      retentionDays: 90,
      customBranding: false,
    },
  },
  "anna@stark.io": {
    customerId: "cust-stark-003",
    company: "Stark Industries",
    tier: "Enterprise",
    seats: 500,
    features: [
      "analytics-dashboard",
      "api-access",
      "sso-saml",
      "custom-reports",
      "data-export",
      "bulk-operations",
      "audit-log",
    ],
    ae: { name: "Mike Chen", email: "mike@ourcompany.com", github: "mike-chen" },
    se: { name: "Sarah Lee", email: "sarah@ourcompany.com", github: "sarah-lee" },
    status: "active",
    renewalDate: "2026-12-01",
    config: {
      maxExportRows: 5_000_000,
      retentionDays: 730,
      customBranding: true,
    },
  },
  "carlos@beta.dev": {
    customerId: "cust-beta-004",
    company: "Beta Inc",
    tier: "Starter",
    seats: 5,
    features: ["analytics-dashboard"],
    ae: null,
    se: null,
    status: "active",
    renewalDate: "2026-04-01",
    config: {
      maxExportRows: 0,
      retentionDays: 30,
      customBranding: false,
    },
  },
};

// ---------------------------------------------------------------------------
// Feature compatibility rules — determines what each tier can access
// ---------------------------------------------------------------------------

const TIER_CAPABILITIES = {
  Starter: {
    allowedFeatures: ["analytics-dashboard"],
    maxExportRows: 0,
    apiAccess: false,
    bulkOperations: false,
  },
  Pro: {
    allowedFeatures: ["analytics-dashboard", "api-access", "data-export"],
    maxExportRows: 10_000,
    apiAccess: true,
    bulkOperations: false,
  },
  Enterprise: {
    allowedFeatures: [
      "analytics-dashboard",
      "api-access",
      "sso-saml",
      "custom-reports",
      "data-export",
      "bulk-operations",
      "audit-log",
    ],
    maxExportRows: 1_000_000,
    apiAccess: true,
    bulkOperations: true,
  },
};

// Feature prerequisite map — some features require others to be enabled
const FEATURE_PREREQUISITES = {
  "data-export": ["api-access"],
  "bulk-operations": ["api-access", "data-export"],
  "custom-reports": ["analytics-dashboard"],
};

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.tool(
  "lookup_customer",
  "Look up a customer account by email address. Returns tier, features, assigned AE/SE, and account status.",
  { email: z.string().describe("Email address of the contact") },
  async ({ email }) => {
    const customer = MOCK_CUSTOMERS[email];
    if (!customer) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                found: false,
                status: "prospect",
                message: `No customer account found for ${email}. This person is likely a prospect.`,
                recommendation:
                  "Flag for AE with context. Do not attempt feature verification for prospects.",
              },
              null,
              2,
            ),
          },
        ],
      };
    }
    return {
      content: [
        { type: "text", text: JSON.stringify({ found: true, ...customer }, null, 2) },
      ],
    };
  },
);

server.tool(
  "verify_feature_compatibility",
  "Check if a proposed feature is compatible with a customer's current tier and configuration. Returns compatibility status, blockers if any, and upgrade recommendations.",
  {
    customerId: z.string().describe("Customer ID"),
    featureName: z.string().describe("Name of the proposed feature"),
    featureDescription: z
      .string()
      .describe("Brief description of what the feature does"),
  },
  async ({ customerId, featureName, featureDescription }) => {
    // Find the customer by ID
    const customer = Object.values(MOCK_CUSTOMERS).find(
      (c) => c.customerId === customerId,
    );

    if (!customer) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                compatible: false,
                customerId,
                error: `Customer ${customerId} not found.`,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    const tierCaps = TIER_CAPABILITIES[customer.tier];
    const issues = [];
    const warnings = [];
    const notes = [];

    // Normalize feature name to a key for lookup
    const featureKey = featureName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check if feature category is available on tier
    const descLower = featureDescription.toLowerCase();

    // Export-related features
    if (
      descLower.includes("export") ||
      descLower.includes("csv") ||
      descLower.includes("download") ||
      featureKey.includes("export") ||
      featureKey.includes("csv")
    ) {
      if (!tierCaps.apiAccess) {
        issues.push(
          `${customer.tier} tier does not include API access, which is required for export features. Upgrade to Pro or Enterprise.`,
        );
      }
      if (tierCaps.maxExportRows === 0) {
        issues.push(
          `${customer.tier} tier does not include data export. Upgrade to Pro (up to 10K rows) or Enterprise (up to 1M rows).`,
        );
      } else if (descLower.includes("bulk") && !tierCaps.bulkOperations) {
        issues.push(
          `Bulk export operations require Enterprise tier. ${customer.company} is on ${customer.tier}.`,
        );
      } else {
        notes.push(
          `Export compatible. Max rows for ${customer.tier}: ${tierCaps.maxExportRows.toLocaleString()}. Customer config allows up to ${customer.config.maxExportRows.toLocaleString()} rows.`,
        );
      }

      // Check prerequisite: data-export requires api-access
      if (!customer.features.includes("api-access")) {
        warnings.push(
          `Customer does not have 'api-access' feature enabled. This may need to be activated before export features work.`,
        );
      }
    }

    // SSO-related features
    if (descLower.includes("sso") || descLower.includes("saml") || descLower.includes("oidc")) {
      if (!tierCaps.allowedFeatures.includes("sso-saml")) {
        issues.push(
          `SSO is only available on Enterprise tier. ${customer.company} is on ${customer.tier}.`,
        );
      } else if (!customer.features.includes("sso-saml")) {
        warnings.push(
          `SSO is available on ${customer.tier} but not currently enabled for ${customer.company}. Activation required.`,
        );
      } else {
        notes.push(`SSO (SAML/OIDC) is enabled and active for ${customer.company}.`);
      }
    }

    // Audit/compliance features
    if (descLower.includes("audit") || descLower.includes("compliance")) {
      if (!tierCaps.allowedFeatures.includes("audit-log")) {
        issues.push(
          `Audit logging requires Enterprise tier. ${customer.company} is on ${customer.tier}.`,
        );
      }
    }

    // General: if nothing specific matched, do a basic tier check
    if (issues.length === 0 && warnings.length === 0 && notes.length === 0) {
      notes.push(
        `Feature "${featureName}" does not match a known capability gate. Assumed compatible with ${customer.tier} tier. Verify with engineering.`,
      );
    }

    const compatible = issues.length === 0;

    const result = {
      compatible,
      customerId,
      company: customer.company,
      feature: featureName,
      tier: customer.tier,
      ...(issues.length > 0 && { blockers: issues }),
      ...(warnings.length > 0 && { warnings }),
      ...(notes.length > 0 && { notes }),
      ...(compatible && {
        verifiedConfig: {
          maxExportRows: customer.config.maxExportRows,
          retentionDays: customer.config.retentionDays,
          apiAccess: tierCaps.apiAccess,
        },
      }),
      ...(!compatible && {
        upgradeRecommendation: `Upgrade ${customer.company} from ${customer.tier} to ${customer.tier === "Starter" ? "Pro or Enterprise" : "Enterprise"} to unblock this feature. Contact AE: ${customer.ae?.name ?? "unassigned"}.`,
      }),
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
