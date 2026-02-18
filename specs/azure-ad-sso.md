# Azure AD / SAML SSO support

## Origin (Multi-Source Attribution)

| Source   | Identifier(s) | Signal strength |
|----------|----------------|-----------------|
| **Gong** | Call `7782822860530291750` — "Globex Industries - Technical Evaluation" (2026-02-12). Tom Wilson (CTO, Globex — **prospect**): "Two things are make-or-break. First, SSO. We're an Azure AD shop and everything has to go through our identity provider. No SSO, no deal." "If SSO and the security story check out, we have budget approved for this quarter." 50 engineers. | **Critical** |
| **Canny** | Request `553c3ef8b8cdcd1501ba4002` — "Azure AD / SAML SSO support" — 23 votes, author Tom Wilson (Globex Industries), status "planned". Details: "Native SSO with Azure AD and SAML 2.0 for enterprise identity. Critical for regulated industries. Many large prospects list this as a hard requirement." | **Critical** |
| **Zendesk** | Ticket 35005 — "SSO timeline for Azure AD", high priority, pending. "We're evaluating your platform for our 50-person engineering team. Azure AD SSO is a hard requirement. What's the timeline?" | **Critical** |

**Weighting:** Deal-blocking language from CTO (decision-maker) in Gong; prospect with budget approved and 50 engineers. Same theme in Canny and Zendesk. Triangulation = **Critical**.

---

## Problem Statement

Prospects and enterprise customers require native SSO with Azure AD and SAML 2.0 so that sign-in goes through their identity provider. Without it, deals are blocked ("No SSO, no deal") and evaluation timelines are stalled. Regulated industries and Azure AD–centric orgs list SSO as a hard requirement.

---

## Customer Quotes

- "Two things are make-or-break for us. First, SSO. We're an Azure AD shop and everything has to go through our identity provider. No SSO, no deal." (Gong — Tom Wilson, CTO, Globex Industries)
- "If SSO and the security story check out, we have budget approved for this quarter." (Gong — Tom Wilson, CTO, Globex Industries)
- "Native SSO with Azure AD and SAML 2.0 for enterprise identity. Critical for regulated industries. Many large prospects list this as a hard requirement." (Canny 553c3ef8b8cdcd1501ba4002)
- "We're evaluating your platform for our 50-person engineering team. Azure AD SSO is a hard requirement. What's the timeline?" (Zendesk 35005)

---

## Requirements

1. **IdP integration:** Support SAML 2.0 and Azure AD (as SAML/OIDC IdP) so that workspace admins can configure an identity provider (metadata URL or XML, entity ID, ACS URL) and enable SSO for the workspace.
2. **SP-initiated flow:** Support service-provider–initiated SSO: user selects "Sign in with SSO" (or is redirected from a workspace-specific login path), is sent to the IdP for authentication, and returns with a valid assertion; the app establishes an authenticated session scoped to the workspace.
3. **Workspace scoping:** SSO configuration is per workspace (e.g. one IdP per workspace); only workspace admins can configure or change SSO settings. Existing workspace-scoped access (e.g. by `workspaceId`) is preserved; no user-specific data scoping beyond what is needed for SSO session.
4. **Security:** Validate SAML responses (signature, audience, expiry); reject unsigned or invalid assertions. Do not use unsanitized user or IdP-supplied values in redirect URLs (prevent open redirect); use allowlisted redirect targets. Store IdP metadata and secrets in a secure manner (e.g. env or secrets store for demo; no hardcoded credentials).
5. **UI / Admin:** Provide a workspace admin surface (or documented API) to configure SSO: enter IdP metadata URL or XML, entity ID, ACS URL, and enable/disable SSO for the workspace. End users see a "Sign in with SSO" (or equivalent) option when their workspace has SSO enabled.

---

## Acceptance Criteria

- [ ] **AC: IdP configuration** — A workspace admin can configure SSO for their workspace by providing IdP metadata (URL or XML), entity ID, and ACS URL; configuration is stored and associated with the workspace; SSO can be enabled or disabled.
- [ ] **AC: SP-initiated SSO** — When SSO is enabled for a workspace, an unauthenticated user can start sign-in (e.g. "Sign in with SSO"), is redirected to the IdP, and after successful IdP authentication is redirected back to the app with a valid assertion; the app validates the assertion and establishes an authenticated session for that workspace.
- [ ] **AC: Validation** — Invalid or expired assertions, or assertions with wrong audience, are rejected; the user is shown an error and no session is created. Redirect URLs used in the SSO flow are allowlisted (no open redirect).
- [ ] **AC: Workspace scope** — Session and SSO config are scoped to workspace; only workspace admins can change SSO settings; existing API behavior (e.g. analytics/export by workspaceId) remains workspace-scoped.
- [ ] **AC: Sign-in option** — When a workspace has SSO enabled, the login/sign-in flow shows a "Sign in with SSO" (or equivalent) option that initiates the SP-initiated flow for that workspace.

---

## Test Requirements

- **Unit:** SAML response validation (signature, audience, expiry) — given valid/invalid assertion payloads, assert accept/reject. Map to AC: Validation.
- **Unit:** Redirect URL allowlist — given candidate redirect URLs, assert only allowlisted targets are used. Map to AC: Validation (open redirect).
- **Integration:** SSO config API (if exposed): create/update/read SSO config for a workspace; assert storage and retrieval. Map to AC: IdP configuration.
- **Integration:** SSO flow (with mock or test IdP): initiate SSO → redirect to IdP → return with assertion → validate and create session; assert session is workspace-scoped. Map to AC: SP-initiated SSO, AC: Workspace scope.
- **Integration:** Invalid assertion → no session, error response. Map to AC: Validation.
- **Component (optional):** Login/sign-in UI shows "Sign in with SSO" when workspace has SSO enabled; click initiates redirect. Map to AC: Sign-in option.

---

## Technical Constraints

- **Backend:** No existing auth/SSO in codebase; this is net-new. Add SSO config storage (per workspace), SAML/OIDC handling (library recommended, e.g. passport-saml or equivalent), and session handling. New routes under `src/api/routes/` (e.g. `auth.ts` or `sso.ts`) and register in `src/app.ts`. Use Zod for any request bodies; validate all IdP-supplied and user-supplied inputs.
- **Frontend:** Add or update sign-in component(s) in `src/components/` to show "Sign in with SSO" when the workspace has SSO enabled and to initiate the redirect. Workspace context (e.g. workspaceId) must be available at login (e.g. from URL or tenant subdomain).
- **Security:** IdP metadata and secrets must not be logged or exposed in client bundles. Redirect URLs must be allowlisted to prevent open redirect. SAML assertions must be cryptographically validated.

---

## UI / Frontend

- **Components/pages:** Sign-in / login flow (e.g. `src/components/` — new or updated login component).
- **Behavior:** When the user lands on login for a workspace that has SSO enabled, a "Sign in with SSO" (or "Sign in with Azure AD") option is **visible**. Clicking it initiates the SP-initiated SSO flow (redirect to IdP). When SSO is not configured or disabled for the workspace, the option is **not shown** (or hidden). No other change to existing login behavior is required unless the spec is extended (e.g. username/password fallback).

---

## Architecture Review

- [ ] **NEEDS_DESIGN_REVIEW:** **Triggered (Gate 1 — New Persistence / Auth).** SSO requires storing IdP configuration per workspace and may require session or token state that survives across requests. Current app is stateless per request with no auth layer. **Reason:** Introducing IdP config storage and SSO session handling is a new persistence and auth pattern. Design must clarify: where IdP metadata and secrets are stored (env, DB, secrets manager), how session is maintained (cookie, JWT, session store), and how workspace→IdP mapping is resolved at login. Do not implement until design is agreed.
- [ ] **NEEDS_SECURITY_REVIEW:** **Triggered (Gate 2 — New Auth / Access Control).** SSO introduces a new identity and token flow (SAML/OIDC); identity is propagated from an external IdP. **Reason:** New auth pattern and token handling surface (assertion validation, redirect URLs, secret storage). Mitigations: validate all assertions; allowlist redirect URLs; do not log or expose secrets; follow OWASP guidance for SAML. Do not implement until security review acknowledges.

The agent MUST NOT proceed to implementation (Plan + Build) until the developer acknowledges these flags. Options: (a) proceed with a proposed design and mitigations after review, (b) descope (e.g. document-only or discovery spike), or (c) defer to security/architecture review.

---

## Stakeholder Routing

- **AEs/SEs to notify on PR:** Gong/Canny/Zendesk attribution — Globex Industries (prospect); CTO Tom Wilson. No product-server customer record; flag for AE (e.g. Lisa Park from Gong call) for prospect communication and timeline update (e.g. Canny status, Zendesk 35005 closure when roadmap is shared).

---

## AI Attribution

- **AI-analyzed:** Ingest (Gong, Canny, Zendesk), triangulation, prioritization, problem statement, requirements, acceptance criteria, test requirements, technical constraints, UI/frontend scope, architecture gate check, stakeholder routing.
- **Human-reviewed:** TBD (spec approval, design review for Gate 1, security review for Gate 2).
