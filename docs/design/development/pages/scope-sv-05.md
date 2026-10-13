# Job-pack preparation and issue follow-through — application design

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:SV-05`. Owner: Dean Fiedler. **Application visual review: pending.**

## Purpose

SV-05 / SC-06 covers the register, first preparation, saved pack, successor preparation, exact checks/output, distribution evidence and explicit crew response under SVC-03, SVC-06 and OUT-09. Current pages use the accepted Figma Job Pack design.

## Desktop

The register is a full-bleed worklist with a 240 px secondary menu, grouped grid, filters, record window and limited selection. The record combines nine immutable saved sections with guided preparation, revision history and a collapsible 320 px status panel. Phone coordinators use Pack/Readiness/History; recipients see only their applicable issue. Use the page-specific contracts for `/service/packs`, `/service/packs/new` and `/service/packs/[id]`.

## Mobile

Phone coordinators use Pack, Readiness and History; recipients read their applicable issue and confirm exact acknowledgement. Review 390/320 CSS px, long text, keyboard focus and overlay menu return.

## Scope limits

The build adds read projections and display preferences, not a migration or new capability. Existing pack.check permission remains applicable to a preparer's own revision when granted, following Dean's delegated decision on 13 October. Every check still identifies an exact saved revision and reason. Current ERP/document/CAD authority and all parent IDs remain unchanged.

## Authority, states and review

Use existing tokens, Button/RegisterTable, SecondaryMenuFrame, worklist menus and PackDialog; the saved sections/forms retain their documented specific controls. Incoming appointment/work-order/personal-job handovers retain stable IDs. Outgoing readiness, exact issued-document and field acknowledgement links retain current permission checks. Register row titles come from verified saved scope; unsupported structured content falls back to saved text. A summary cannot clear a dispatch hold. Selection never issues, checks, withdraws or acknowledges.

Loading, empty, filtered-empty, denied reads, stale source, saved/unsaved preparation, pending/recoverable output, review-required and withdrawn states remain distinct. Denial clears protected content. Keyboard tab lists support arrows/Home/End, disclosures remain native and modal Escape returns focus. No offline business capability is introduced.

References: [accepted Figma decision](../../../decisions/job-pack-figma-design.md), [icon-free boards and frame offsets](../../../reference/ui/service/job-pack-design-r01/README.md), [implementation decision](../../../decisions/job-pack-figma-implementation.md), [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Earlier [r03 HTML](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html) and I1–I7 evidence retain their historical and exact-content provenance. Licensed Kit icons are supplied at runtime; local verification uses the original fallback drawings. No source image is missing.

The design source is accepted; application owner/device and assistive-technology review remain open. Functional verification, source availability and hosted deployment are separate fields. Review fingerprints remain unchanged until a real review is recorded. The draft page guide follows the same actual controls and remains unapproved.
