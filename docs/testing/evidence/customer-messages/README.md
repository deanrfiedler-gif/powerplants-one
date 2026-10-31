# Customer messages EC-04 execution and comparison

Owner: Dean Fiedler. Implementer: Codex. Source design: Customer messages — accepted, 22 October 2026. Integrated base: `1402c87b`. Application review, owner acceptance and deployment are separate from that design acceptance.

## Functional proof

In progress. Focused unit checks: 11 passed. Native database, HTTP, browser and final repository checks are pending. Real npm ci succeeded on Node 24.22.2/npm 11.19.0 without override or junction. No migration, capability, grant or dependency was added. Native tests use an isolated loopback PostgreSQL cluster and only `ppo_synthetic_test`.

## Visual comparison

In progress; application captures have not yet been inspected. Retained references: [EC-04 r01](../../../reference/ui/email-calendar/customer-messages-design-r01/README.md). Planned widths: 1440, 1024, 390 and 320. No visual acceptance is claimed.

## Differences and open review

- Current shell retains Sales Inbox rather than the drawing's Email rail label, as requested. Existing Inbox controls remain; unbuilt EC-01 compose/folders/views are not fabricated.
- Bound Supply Demand and quantity/unit evidence replaces the example work-order link and unsupported line counts. Stored names, content, times and counts differ from the historical Figma story.
- Full content/definition hashes and explicit simulation/window wording are longer than the drawing's abbreviated checks.
- Template management is not on current main; the handover is explicitly unavailable and stored version/hash stays visible. No invented template route or editor.
- Class switches are M1/M2 plus classes represented by real readable records; no fabricated M3/M4 source workflow. The read is a disclosed bounded candidate window.
- Native withdrawal and reconciliation require a reason. Queue refresh is explicit; no pull-to-refresh claim.
- Phone follow-up/class states and zoom reuse shared patterns without a drawn baseline. Independent visual and owner/device/assistive-technology review remain pending.

## Acceptance and deployment

Functional proof: in progress. Paired application visual review: pending. Owner acceptance: accepted source design only; no application acceptance. Deployment: not performed. Exact-head Claude review and every CONTRIBUTING merge gate remain required.
