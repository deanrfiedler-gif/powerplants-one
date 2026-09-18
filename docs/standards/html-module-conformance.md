---
document_id: PPO-UI-CONFORMANCE
title: HTML module scope and design conformance
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Authorised package discipline; individual design and baseline acceptance remain separate
---

# HTML module scope and design conformance

Dean authorised correcting ES-05’s presentation, creating ES-06 around the retained quotation r03 experience, and requiring each subsequent package to identify its existing scope ID, chosen r20 page type, reused components and handover boundaries. Proposed departures must be visible before they become a new baseline.

## Required declaration in each package

Every new or substantively revised HTML module and companion report must include the following declaration. Repeat the scope ID and design revision in the HTML’s local page context or demonstration notes; retain the full conformance table in the report and design/handover record.

| Field | Required content |
|---|---|
| Scope identity | Existing page-register ID and title, exact source edition, relevant parent IDs and the requested increment. Do not create a new module merely because a new layout is convenient |
| Page type | Choose the task-appropriate r20 type: Overview / dashboard; Register / worklist; Record detail; Form / guided workflow; Planning workspace; Review / comparison; Work queue + persistent detail; Document & evidence workspace. Identify supporting types and any variant |
| Reused components | Name the actual source files/editions for shell boundary, title/context, tabs, controls, registers/cards, form patterns, decisions, snapshots, document views and responsive treatment |
| Source authority | Distinguish user decisions, accepted design, uploaded reference, proposed composition, fictional fixture and unavailable evidence. Record source hashes where retained bytes matter |
| Incoming handover | State the source record, version, approval/issue identity, actor scope and evidence required before the module can act |
| Outgoing handover | State what it produces, who owns the next action and what remains with the receiving module. Distinguish prepared, sent, received, accepted and converted outcomes |
| Exceptions and recovery | Identify normal, missing/stale source, returned, read-only, failed, unknown and superseded treatments that actually apply |
| Departures | Name the difference from the reference, why it is needed, affected screens and whether it is a proposal or already authorised. Do not treat a prototype or merge as owner baseline approval |
| Verification | Record actual checks, exact artifact identities, visual/device evidence and unverified areas. Separate code/design delivery from acceptance and runtime integration |

The r20 composition study contains source-linked adaptations and proposed layouts. Its examples do not mandate one universal set of tabs or identical content density. Choose layout by the task while retaining the shared visual language and scope boundaries. Preserve source-specific approved measurements where they exist.

## Reuse rules illustrated by ES-05 and ES-06

- Staff modules provide their workspace interior. The shared application shell owns app-level navigation, branding, global search and user context. Do not add a competing app masthead to each page.
- Use a right-side inspection panel for snapshots and record evidence. Keep centred dialogs for short decisions, reasons and confirmations. Declare any required departure.
- The retained customer quotation r03 is a customer document surface. Its corporate masthead belongs to that external document and is preserved. Its presence does not justify adding another app header to the staff workspace.
- Customer document styling should be shared from its source. Bind each preview to its exact quotation content; never copy unrelated customer names, amounts, clauses or payment milestones merely to match appearance.
- ES-05 owns exact review, approval, issue and distribution evidence. ES-06 owns customer response and negotiation. ES-07 owns item resolution and conversion. ES-08 remains the defined Screen Systems configuration family.
- Changed content needs a successor with fresh review and issue. Earlier signatures, consent, acceptance and acknowledgements remain with their original revisions.

## Baseline treatment

Keep issued references unchanged and publish a new revision for a correction. Update the latest-family index, stable decision record, document register and current status in the same contribution. Preserve historical inventory counts as dated observations.

Do not change the accepted UI baseline register simply because an HTML file was generated or a check passed. Record an owner decision with its screen/device scope before promoting a proposed departure. This does not introduce another permission step for work the user already authorised: prepare and publish the concrete reviewable package first.

This standard governs package discipline, not new business scope or architecture. It authorises no live customer communication, operative commercial terms, pricing formula, ERP write, deployment or migration.

## Application integration gate

When moving an HTML module into the app, declare its canonical route, stable scope, layout mode (`full-bleed`, `padded` or `constrained`), scrolling owner, source hashes, shared-control edition and adaptations in the baseline register. Match the route to the runtime module-workspace registry. The shell owns navigation and viewport height; the module owns its interior. Do not carry a standalone demo frame or second viewport into the application by default.

Preview with the complete root stylesheet order. Independently load the issued HTML and shared theme in browser verification, comparing source measurements and authorised host adaptations. Include compiled-application checks in an existing required job. Capturing the implementation, matching its own tokens or passing save tests does not establish design conformance. A newly registered module without retained sources, component comparison proof or compiled proof fails conformance. Add a negative control for a previously observed defect.

Before release, inspect original paired captures at agreed CSS viewports, menus, inspection panels, forms, long/unknown content and scrolling. Do not update expected images merely to make an implementation pass. Keep component, PR and deployed evidence separate. The [Deals correction](../decisions/crm-deals-design-correction.md) is the first enforced application contract.
