# Job-pack preparation and issue follow-through — application design

<!-- versioning: git; committed history is authoritative -->

Stable entry: `scope:SV-05`. Owner: Dean Fiedler. **Application visual review: pending.**

## Purpose

SV-05 / SC-06 covers the register, first preparation, saved pack, successor preparation, exact checks/output, distribution evidence and explicit crew response under SVC-03, SVC-06 and OUT-09. Current pages use the accepted Figma Job Pack design.

## Desktop

The register is a full-bleed worklist with a 240 px secondary menu, grouped grid, filters, record window and limited selection. The record combines nine immutable saved sections with guided preparation, revision history and a collapsible 320 px status panel. Phone coordinators use Pack/Readiness/History; recipients see only their applicable issue. Use the page-specific contracts for `/service/packs`, `/service/packs/new` and `/service/packs/[id]`.

## Mobile

Phone coordinators use Pack, Readiness and History; recipients read their applicable issue and confirm exact acknowledgement. Review 390/320 CSS px, long text, keyboard focus and overlay menu return.

## Field readiness gate (amendment A06)

Accepted on 16 October 2026 and built in its first increment ([field readiness gate record](../../../decisions/field-readiness-gate-proposal.md), section 10; [Job pack design amendment A06](../../../decisions/job-pack-figma-design.md)). Frames: Job pack page section A1 `958:9304`; captures 01–07, 11 and 12 in [field readiness gate r01](../../../reference/ui/service/field-readiness-gate-r01/README.md). The named Figma version waits for Dean's explicit yes.

- **Recipient, desktop and phone.** Return sits beside the unchanged "Acknowledge this exact issue as …" button in Crew acknowledgement. The Return sheet asks for one or more of six reasons and a required note of up to 1,000 characters, and names "the preparer". After a return, the recipient's notice reads "Returned · time" with the reasons and note; after a "No change needed" answer it quotes the answer and offers acknowledgement again. My jobs links here with `?action=return`, which opens the sheet once for an eligible recipient.
- **Staff.** An unanswered return shows the state label "Returned by technician", makes "Prepare revision rNN" the primary action and adds a notice that quotes each return, with "No change needed…" for someone who can prepare. The dispatch bar counts returned crew members.
- **Readiness.** On `SYN-PPO-P04` v2 the Dispatch group lists "Parts ready for the stated material scope" with its words from Supply Chain. Section 07 carries a live parts panel, labelled as not part of the issued pack and hidden in the workbench print. Crew rows show "Not yet opened" until the recipient opens the issue or responds.
- **Layout rules kept.** Nine `.jp-section-head h2` in the pack panel, and "criteria satisfied" once on the page.

## Scope limits

The Job Pack Figma build added read projections and display preferences, not a migration or new capability. The field readiness gate adds migration 0107 and seed 107 and still no capability. Existing pack.check permission remains applicable to a preparer's own revision when granted, following Dean's delegated decision on 13 October. Every check still identifies an exact saved revision and reason. Current ERP/document/CAD authority and all parent IDs remain unchanged.

## Authority, states and review

Use existing tokens, Button/RegisterTable, SecondaryMenuFrame, worklist menus and PackDialog; the saved sections/forms retain their documented specific controls. Incoming appointment/work-order/personal-job handovers retain stable IDs. Outgoing readiness, exact issued-document and field acknowledgement links retain current permission checks. Register row titles come from verified saved scope; unsupported structured content falls back to saved text. A summary cannot clear a dispatch hold. Selection never issues, checks, withdraws or acknowledges.

Loading, empty, filtered-empty, denied reads, stale source, saved/unsaved preparation, pending/recoverable output, review-required and withdrawn states remain distinct. Denial clears protected content. Keyboard tab lists support arrows/Home/End, disclosures remain native and modal Escape returns focus. No offline business capability is introduced.

References: [accepted Figma decision](../../../decisions/job-pack-figma-design.md), [icon-free boards and frame offsets](../../../reference/ui/service/job-pack-design-r01/README.md), [implementation decision](../../../decisions/job-pack-figma-implementation.md), [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Earlier [r03 HTML](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html) and I1–I7 evidence retain their historical and exact-content provenance. Licensed Kit icons are supplied at runtime; local verification uses the original fallback drawings. No source image is missing.

The design source is accepted; application owner/device and assistive-technology review remain open. Functional verification, source availability and hosted deployment are separate fields. Review fingerprints remain unchanged until a real review is recorded. The draft page guide follows the same actual controls and remains unapproved.

## P4/P5 backend consumer note — 24 October 2026

[PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690) implements the authorised backend/API slice in draft. The [service API amendment](../../../contracts/service-api.md) defines typed contact checks and the narrow preparation projection. UI wiring of the accepted P4/P5 designs is a separate follow-up; existing unavailable-state copy remains until that work is accepted and built. This note adds no visual-review evidence or acceptance claim.
