# Signal-to-Code: Demo Slides

Use these 5 slides to frame the demo. Keep them simple; the demo is the hero.

---

## Slide 1: Title

# Signal-to-Code
### Turning Customer Voice into Shipped Software
**Ingest → Triangulate → Spec → Build → Verify → PR**

---

## Slide 2: The Problem

### The "Success Metric" Gap

**For Customers:** It's responding to feedback.
*   Signal is scattered (Gong, Canny, Zendesk).
*   Context is lost by the time it hits Jira.
*   We ship features, but lose the *why*.

**For Engineering Leaders (NVIDIA, Adobe, Stripe):**
*   "Lines of Code" is a vanity metric.
*   "AI Acceptance Rate" doesn't measure value.
*   **The Real Metric:** PRs merged that solve specific customer pain.

**The Goal:** Connect the **Signal** (Pain) to the **PR** (Solution) with full traceability.

---

## Slide 3: The Solution

### One Continuous Workflow

Instead of 5 tools, one pipeline inside Cursor:

1.  **Ingest:** Pull signal from Gong, Canny, Zendesk.
2.  **Triangulate:** Weight by role (VP vs IC) and deal value (Enterprise vs Pro).
3.  **Spec:** Agent writes a spec with **Origin** (quotes) and **Requirements**.
4.  **Build:** Plan & implement (Code + UI + Tests).
5.  **Verify:** Check against Customer Tier (Product Server).
6.  **PR:** Open a PR with an **Outcome Line**.

---

## Slide 4: Architecture (How it works)

### Velocity with Guardrails

It's not just "AI writing code." It's an enterprise system:

*   **Rules:** Enforce architecture (e.g., "No new persistence without review").
*   **MCPs:** Connect to real systems (Gong, Linear, Canny).
*   **Hooks:** Invisible safety (Security scans on edit, Tests on stop).
*   **Plugin:** Distributable to 500+ devs as a single package.

---

## Slide 5: The Future

### From "Capacity" to "Sequencing"

**The definition of "Developer" is changing.**

*   **Today:** The bottleneck is engineering hours.
*   **Tomorrow:** Code is abundant. The bottleneck is **Sequencing**.
    *   *What* do we build next?
    *   *Why* does it matter?
*   **Vision:** We aren't just automating code. We're automating the decision of *what* to code so you can focus on the release.

---
