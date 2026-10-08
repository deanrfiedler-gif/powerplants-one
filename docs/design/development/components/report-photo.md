# Submitted report photo inspection

<!-- versioning: git; committed history is authoritative -->

Stable component: `report-photo`. Owner: Dean Fiedler. Status: Draft for visual review. Source baseline: PR #370 `476dd0598c4aa92b572a03ce3b172d351d1b07a3`.

ReportPhoto is a Service-review host component. It reuses Button and ErrorNotice, with the existing report snapshot caption and original-byte verification. Its consumer is the Submitted ReviewForm on `route:/service/reports/[id]`; it is separate from the customer-safe ExactReportPresentation.

States: closed without a fetch; opening with a spoken status; verified original image; denied or unavailable with retry; byte mismatch without an image; hidden, refreshed or identity-changed with request cancellation and URL disposal. The owning form's decision and reason remain when the photo fails, is hidden or refreshed. Changing report/revision/photo/identity remounts the image child. No new operation receipt or business decision is created.

## Desktop

Desktop and phone retain one page scroll owner. The image preserves its proportions, fits the available width and is bounded to 70vh; caption and controls wrap. Inspect/Hide/Retry are shared secondary buttons with native keyboard activation. The button declares expanded state and controls the inline region, which introduces no modal focus trap. A successful opening keeps focus on the control; an error focuses the shared alert. Keyboard retry returns focus to the still-mounted Hide control as Retry is removed. The host browser test is the runnable fixture; there is no isolated business-session-free catalogue example.

## Mobile

At 390 and 320 CSS px the same labelled controls and original image fit the available width without horizontal page scrolling. Physical touch and screen-reader acceptance remain separate from emulation.

The retained Service Review & Reports r02 HTML supplies the task reference. No native desktop or phone composition is owner accepted. Working adaptation: inline protected original rather than a demonstration inspector; no public image optimiser, external image link or customer distribution. Missing accepted paired images, actual assistive-technology use and physical-device review remain visible gaps.

See [decision](../../../decisions/report-photo-inspection.md) and [execution](../../../testing/evidence/report-photo-inspection/README.md). Exact historical revision reads are server supported for the current review owner, while this component is initially offered only for the current Submitted revision.
