# Create job pack — application design

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/service/packs/new`. Owner: Dean Fiedler. **Application visual review: pending.**

## Purpose

Prepare the first immutable revision for one confirmed visit. Page type: guided Preparation in the Job Pack record workspace, SV-05 / SC-06.

## Desktop

Without an appointment, the register's Prepare job pack chooser offers permitted confirmed unstarted future visits genuinely lacking a pack. With an appointment, show the same 240 px contents menu and preparation paper as the record workspace. Existing packs redirect to their canonical record. Nine labelled notes and exact source/history selection retain existing validation. The first save requires a recorded reason and creates one immutable revision; uncertain retries retain the original operation.

## Mobile

Use one-column labelled fields and 44 px actions at 390/320 px. Job packs menu opens an overlay; a numbered item focuses the corresponding field section and closes the overlay. Keep unsaved changes across menu/guide use and ask before abandoning them. There is no issued paper before the first saved revision.

## Authority, states and review

Use existing tokens, Button/RegisterTable, SecondaryMenuFrame, worklist menus and PackDialog; the saved sections/forms retain their documented specific controls. Incoming appointment/work-order/personal-job handovers retain stable IDs. Outgoing readiness, exact issued-document and field acknowledgement links retain current permission checks. Register row titles come from verified saved scope; unsupported structured content falls back to saved text. A summary cannot clear a dispatch hold. Selection never issues, checks, withdraws or acknowledges.

Loading, empty, filtered-empty, denied reads, stale source, saved/unsaved preparation, pending/recoverable output, review-required and withdrawn states remain distinct. Denial clears protected content. Keyboard tab lists support arrows/Home/End, disclosures remain native and modal Escape returns focus. No offline business capability is introduced.

References: [accepted Figma decision](../../../decisions/job-pack-figma-design.md), [icon-free boards and frame offsets](../../../reference/ui/service/job-pack-design-r01/README.md), [implementation decision](../../../decisions/job-pack-figma-implementation.md), [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Earlier [r03 HTML](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html) and I1–I7 evidence retain their historical and exact-content provenance. Licensed Kit icons are supplied at runtime; local verification uses the original fallback drawings. No source image is missing.

The design source is accepted; application owner/device and assistive-technology review remain open. Functional verification, source availability and hosted deployment are separate fields. Review fingerprints remain unchanged until a real review is recorded. The draft page guide follows the same actual controls and remains unapproved.
