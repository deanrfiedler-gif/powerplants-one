# Job pack detail — application design

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/service/packs/[id]`. Owner: Dean Fiedler. **Application visual review: pending.**

## Purpose

Read the complete saved technician pack, prepare a successor, review exact history and progress only the commands permitted to the viewer. Page type: Record detail with guided Preparation, history and decision dialogs; SV-05 / SC-06.

## Desktop

At 1440 × 900, the 240 px secondary menu contains views and nine numbered sections. The white record header uses a 24/30 px title from verified saved scope, state badge, revision/preparer/save metadata, print and one primary action by state. Remaining actions sit in Job pack actions. The dispatch strip reports server conditions and retains all additional hold reasons.

The content uses 24 px outer spacing, a 20 px paper/status gap and a 320 px status panel. Collapse status panel leaves a 48 px strip; the viewer's preference is scoped to workspace and actor. Each saved section uses 24 px padding, 15/22 px section title, 12/16 px labels/source provenance and 14/20 px facts. The contents jump focuses its target; the module owns scrolling. Preparation retains the original nine fields, exact source selection, change/reason dialog, discard and saved-only print choices. The history view preserves reasons and readable people/issue labels.

Readiness keeps action-required rows visible in their actual stage; satisfied rows use disclosures. The header holds the primary check/issue/recovery/document action. Returned/source-change/recovery notices remain meaningful and routine states avoid duplicate notices.

## Mobile

At 390/320 px, the coordinator has Pack, Readiness and History tabs. Preparation and numbered sections remain available through Job packs menu. The technician sees only permitted applicable issue content, can open the exact issued document and confirms acknowledgement in its own dialog. Failed commands retain the error and original retry context. Neither a viewed document nor simulated distribution counts as acknowledgement.

Saved-content printing releases shell clipping, hides controls and prints all nine sections even from Preparation. Unsaved notes are excluded and the workbench copy is explicitly not the controlled issued output.

## Authority, states and review

Use existing tokens, Button/RegisterTable, SecondaryMenuFrame, worklist menus and PackDialog; the saved sections/forms retain their documented specific controls. Incoming appointment/work-order/personal-job handovers retain stable IDs. Outgoing readiness, exact issued-document and field acknowledgement links retain current permission checks. Register row titles come from verified saved scope; unsupported structured content falls back to saved text. A summary cannot clear a dispatch hold. Selection never issues, checks, withdraws or acknowledges.

Loading, empty, filtered-empty, denied reads, stale source, saved/unsaved preparation, pending/recoverable output, review-required and withdrawn states remain distinct. Denial clears protected content. Keyboard tab lists support arrows/Home/End, disclosures remain native and modal Escape returns focus. No offline business capability is introduced.

References: [accepted Figma decision](../../../decisions/job-pack-figma-design.md), [icon-free boards and frame offsets](../../../reference/ui/service/job-pack-design-r01/README.md), [implementation decision](../../../decisions/job-pack-figma-implementation.md), [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Earlier [r03 HTML](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html) and I1–I7 evidence retain their historical and exact-content provenance. Licensed Kit icons are supplied at runtime; local verification uses the original fallback drawings. No source image is missing.

The design source is accepted; application owner/device and assistive-technology review remain open. Functional verification, source availability and hosted deployment are separate fields. Review fingerprints remain unchanged until a real review is recorded. The draft page guide follows the same actual controls and remains unapproved.
