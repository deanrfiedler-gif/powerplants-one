# Reviews & approvals — page contract

Stable key: `route:/estimating/reviews`. Navigation: `estimate-reviews`. Scopes ES-04 and ES-05; existing EST-03/04/05/07/08, PPO-010, AT-01/26 remain. Owner: Dean Fiedler. Visual review and owner/device acceptance remain pending.

## Purpose, design and handovers

The accepted register combines permitted native estimate reviews and quotation approvals. Incoming: ES-04 submissions and ES-05 prepared release revisions. Outgoing: exact submission/kind at `/estimating/estimates/[id]/review?submission_id=…&kind=…`, exact quotation revision at `/estimating/quotes/[revision-id]/release`, and saved estimate `?version_id=…`. No decisions occur in the register or snapshot.

Figma **PPO - Design**, page **Reviews & approvals (accepted)** `56:2`, named version **Reviews & approvals — Pipedrive pattern, accepted**: desktop `77:635`, selection `81:1002`, phone `104:1803`. Live frames inspected 24 October 2026; later shared top-bar/phone-header amendments are reused. Additional delivery/workflow frames marked review pending do not amend the native ES-04/05 rules. [Accepted decision](../../../decisions/estimate-reviews-design.md); [seven retained r01 captures](../../../reference/ui/estimating/reviews-approvals-design-r01/README.md), preserved unchanged. Page type: r20 Register / worklist with overlapping snapshot.

## Desktop

Reuse Application shell, SecondaryMenuFrame, Button/ButtonLink, RegisterTable/RegisterChip, WorklistChoice and WorklistPanel. A 240 px secondary menu, 60 px toolbar and flush 40 px grid rows follow the accepted composition. Fixed selection and settings/action columns remain visible while the grid scrolls horizontally. Columns: exact reference/revision, title, review kind, native state, elapsed waiting, permitted AUD sell value and recorded submitter. Value is ex tax under the native synthetic tax basis; unknown is not zero. Column selection changes presentation only.

All reviews, Awaiting my review, Quotation approvals, Returned for changes, Reviewed and Submitted by me are overlapping views. Reviewed includes the separate Approved/Issued quotation outcomes without renaming them. Review type/site filter the current candidate window; search is sent to the native candidate query. Every count is a readable review-row count for that window. One estimate can contribute three rows. The footer states the 25-candidate limit; no candidate total or global backlog is inferred. Next window remains available after a filtered-empty window. Offset reads are live and may move as new work arrives.

The 360 px selection panel opens exact snapshots oldest first or exports selected rows after rechecking current visibility and evidence. Selection does not span windows and changed source/permission/sequence keys invalidate it. No bulk approval exists. Snapshots overlay the grid, align to the secondary menu edge, and retain close/previous/next. Obscured controls are inert; Escape returns focus. The left column shows selected saved facts, source changes and native handovers. Findings/Files and attributable native history occupy the right column. Missing file collections and limited history sources are explicit.

## Mobile

Use the accepted compact phone header and five-tab Estimating navigation (My Work, Intake & workload, Estimation wizard, Reviews & approvals, More). At 390 and 320 px, flush rows show title/value, exact revision/kind and state/waiting. Labelled checkboxes provide discoverable keyboard/touch selection; this is the proposed implementation of the undrawn phone selection interaction. A selected review fills the phone viewport with reachable Close and native handovers. Filters use the shared labelled dialog; views use the shared chooser. Long content wraps in snapshots, while compact titles retain accessible full names. Native table semantics, labelled actions, visible focus, Escape and tab arrow keys are required. Online reads only; no offline approval or queue is added.

## States and adaptations awaiting review

Loading, complete no-work, no matches with continuation, quotation-source denied, partial, full read failure, retry, changed basis, returned findings/responses, carried-forward decisions and superseded submissions remain distinct. A failed read removes protected rows, counts and actions. Snapshots reread exact source authority. Native estimate entry refuses to silently switch a selected old submission to a successor; current review is an explicit handover.

Adaptations to the drawn fixture: honest per-window counts/continuation and observation time; neutral elapsed-since-submission rather than invented overdue; source-owned synthetic reference formats; explicit phone checkboxes; native file/history scope; retained local fallback icons when the licensed Kit is absent. No fabricated badge, notification count, SLA or production approval. Screenshot comparison and validation belong in the [queue evidence](../../../testing/evidence/estimating-review-queue/README.md). No review fingerprint is adopted by this implementation.
