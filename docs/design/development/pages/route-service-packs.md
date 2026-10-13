# Job pack register — application design

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/service/packs`. Owner: Dean Fiedler. **Application visual review: pending.**

## Purpose

Find and inspect permitted saved packs, identify held visits and prepare the first pack for an eligible appointment. Page type: Register / worklist (r20), SV-05 / SC-06; SVC-03, SVC-06, OUT-09.

## Desktop

At 1440 × 900, the application shell retains the viewer's primary rail preference. A 240 px secondary menu provides All, Prepared by me, five state views, four attention views and two Next 7 days views. Counts cover the permitted read. The 60 px toolbar provides preparation, Technician/Site filters, count, refresh and export. Visit groups use the site's calendar; Next 7 days is a rolling seven-day window from the server observation time.

The horizontally scrollable grid has 40 px single-line rows, 32 px group headings, fixed 44 px checkbox/action columns and twelve data columns. Optional columns can be hidden. Checkbox selection opens a 360 px panel with Open in sequence, Export list and Clear selection. Row inspection opens a modal over the register, with permitted visit facts, dispatch holds, Readiness/Crew tabs, history and the full record link.

Prepare job pack lists confirmed unstarted future visits for which no pack exists and the viewer has prepare permission. A denied or hidden existing pack never becomes a new-pack opportunity. `/service/packs/new` without an appointment opens this chooser.

## Mobile

At 390/320 px, use compact flush three-line rows grouped by day, a view picker, count and Filter job packs. Filters also contain preparation and refresh. Row activation opens the full record. No page-level horizontal scroll; desktop grid scrolling stays within the register. Review 1440/1024/820/770/390/320 widths and effective 200% zoom.

## Authority, states and review

Use existing tokens, Button/RegisterTable, SecondaryMenuFrame, worklist menus and PackDialog; the saved sections/forms retain their documented specific controls. Incoming appointment/work-order/personal-job handovers retain stable IDs. Outgoing readiness, exact issued-document and field acknowledgement links retain current permission checks. Register row titles come from verified saved scope; unsupported structured content falls back to saved text. A summary cannot clear a dispatch hold. Selection never issues, checks, withdraws or acknowledges.

Loading, empty, filtered-empty, denied reads, stale source, saved/unsaved preparation, pending/recoverable output, review-required and withdrawn states remain distinct. Denial clears protected content. Keyboard tab lists support arrows/Home/End, disclosures remain native and modal Escape returns focus. No offline business capability is introduced.

References: [accepted Figma decision](../../../decisions/job-pack-figma-design.md), [icon-free boards and frame offsets](../../../reference/ui/service/job-pack-design-r01/README.md), [implementation decision](../../../decisions/job-pack-figma-implementation.md), [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Earlier [r03 HTML](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html) and I1–I7 evidence retain their historical and exact-content provenance. Licensed Kit icons are supplied at runtime; local verification uses the original fallback drawings. No source image is missing.

The design source is accepted; application owner/device and assistive-technology review remain open. Functional verification, source availability and hosted deployment are separate fields. Review fingerprints remain unchanged until a real review is recorded. The draft page guide follows the same actual controls and remains unapproved.
