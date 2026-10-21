# Changes and follow-up — PL-04 design contract

Stable entry: `route:/schedule/changes`. Owner: Dean Fiedler. Status: **Draft for visual review**.

## Native workflow

Page type: **Work queue + persistent detail**. Canonical destination: `/schedule/changes`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select the period, timezone and site, then Needs review, Change requests, Customer follow-up, Cancellations or History / all visits.
2. Select the exact appointment. Compare current versus requested interval, crew roles, explicit travel allowances/reasons and schedule/request versions.
3. Enter a decision reason and use existing Accept and check move, Reject request or Cancel request where permitted. Acceptance reruns booking guards; pending requests reserve nothing.
4. Open appointment controls for move/reassignment, customer contact or cancellation. Review owned follow-up, booking history and contact events separately.

An exact appointment handover stays visible even outside the selected date/queue. Changed booking facts require fresh contact and preparation review. Contact is not delivery or pack acknowledgement.

## Desktop

Accepted design: the [Changes and follow-up design decision](../../../decisions/changes-follow-up-figma-design.md) of 18 October 2026, with captures 01–06 (desktop 1440 × 900) and 08 (tablet 1024) in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md).

- **Queues:** the five queues are side-menu views with counts under "Changes & follow-up"; Policy impact, Travel review and Demand & capacity sit under "Reviews" (D1). Counts follow the selected period and site (Q3).
- **Register:** a Changes grid with Visit, Work, Needs review because, Booked, Requested, Customer, Follow-up and Site; a row opens the PL-02 large snapshot with previous and next (D2). An exact appointment from Travel review shows a banner and stays visible when the period and queue would hide it.
- **Selected visit:** the booking now, crew, travel and versions, then what a change sets in motion: customer contact, job pack re-acknowledgement, site readiness (gate P4) and dispatch holds (D3). Change request, Follow-up and History tabs; each changed value is named in words.
- **Decisions:** Decision reason, Accept and check move and Reject request, as built; Cancel request sits in the request card's "…" menu (Q1). A stale request names what changed since it was made and does not block on its own (D4).
- **Follow-up:** owned follow-up activities with owner, due time and state, then recorded customer contact; "Record customer contact" opens the existing SV-04 control (D5). After an accepted move it is the primary action (Q4).
- **Policy holds** stay out of Needs review and show in the planner's Needs attention band (Q2).
- **Shell:** reuse the existing Service rail and compact phone header; Conversations is outside this change.
- The accepted composition is implemented; owner visual review remains pending.

Keep the bounded coordination queue beside one selected appointment at 1440 x 960 and 1024 x 768. Show current/requested time, crew roles, explicit travel and versions together before a request decision. Customer commitment, dispatch/preparation consequences, owner and history remain separate.

## Mobile

Accepted design: captures 09–12 in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md). The title is "Changes"; the queue is list rows in the PL-02 phone pattern. The review is one scroll: the request card first, with Booked now and Requested as stacked blocks, "Changed" tags, the decision reason and full-width buttons; then the consequences, Booked now and history. At 320 px Move or reassign moves into More (D6). Four states: loading, empty queue, could not load, and view only.

Stack queue, selected review and current/proposed sections at 390 x 844 and 320 CSS px. Requests retain labelled decision reasons and server error/recovery controls. After a saved decision, focus returns to the review heading. Exact appointment handovers are explicitly identified when date/queue filters are bypassed. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

ChangesWorkspaceScreen and page-local review/frame compositions reuse SecondaryMenuFrame/useSecondaryMenu, the compact phone header, RegisterTable/RegisterChip, Button/ButtonLink, WorklistMenu/WorklistPanel, RecordTabs/RecordPanel/useUnsavedChanges, Field, Stamp, ReadState, ErrorNotice and useResource/useCommand. Request decisions share the existing useRequestDecision command hook. Icons use existing Kit mappings and styles use shared tokens. No new shared component family.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. Existing validation, stale-version, saving, uncertain outcome, unchanged retry and success states remain in the authoritative booking controls.

## Handovers and authority

Incoming: period/site/resource queue or exact PL-05 appointment handover. Outgoing: existing appointment move/reassignment/contact/cancellation controls and owned follow-up Activities. Expected appointment/request/resource/calendar versions, original operation receipts and history remain authoritative.

## Visual references and verification

Accepted Figma design: [Changes and follow-up design r01 captures](../../../reference/ui/service/changes-follow-up-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/changes-follow-up-figma-design.md). The named version "Changes and follow-up — accepted" is saved. Images of the Cancellations and History / all visits rows, a tablet snapshot, the Cancel request menu, and saving, uncertain-outcome and unchanged-retry states are still missing.

[Scheduling & Appointments r01](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) is a proposed reference. Current authorised work-order demand and appointment contracts supersede its unassigned-proposal example. Retained source bytes are unchanged.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Queue and selected appointment are retained in the page address and in the allowlisted return from appointment controls. Only Open and InProgress follow-up Activities enter Customer follow-up or contribute an outstanding task to Needs review; Completed and Cancelled remain history. An independent pending request, changed commitment or scope review can still require review.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## NAV contextual navigation

Scheduling change follow-up has its own breadcrumb and retains the shared secondary-menu view, day/timezone/site/resource query contract.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.


## PL-04 implementation and exact references

Figma file **PPO - Design**, page `1326:4525`, named version **Changes and follow-up — accepted**. Index `630:2`, notes `1335:3505`, page parts `1335:3501`, grid header `1326:4888`, row `1326:4902`.

Desktop 1440 × 900: `1326:4561`, `1326:4656`, `1331:3860`, `1334:315770`, `1332:1465`, `1334:315082`. Tablet 1024 × 900: `1333:313396`. Phone list 390 × 844: `1333:313870`; review 390: `1333:313910`; review 320: `1334:2974`. States: loading `1334:7420`, empty `1334:7477`, error `1334:7519`, view only `1334:314921`. The retained captures above remain unchanged.

Menu counts come from the selected period/site read separately from exact-appointment evidence. Opening a row focuses its snapshot heading; Close restores row focus. Search filters the returned bounded population. Search/site/timezone use the compact phone header’s filter sheet. At 320 px the comparison stacks and Move or reassign is in More. The register owns horizontal overflow on desktop/tablet.

The combined detail read retains the pack permission/assignment boundary. Unavailable pack/dispatch evidence is labelled; it never means zero acknowledgements or cleared dispatch. P4 is explicitly gated, unbuilt and unconfirmed. No new offline support. The accepted-decision comparison uses retained booking revisions; missing history is labelled.

[Implementation boundaries](../../../decisions/changes-follow-up-implementation.md) records D4’s server alignment and the user’s direction. Current request/appointment/policy/resource/calendar/crew checks remain. The existing contact and move forms receive an allowlisted action handover and current permission checks.

Open questions: the checkbox bulk operation and column settings are unspecified and omitted; a tablet snapshot, Cancel request menu artwork and detailed saving/uncertain-send artwork are absent. Shared controls supply existing behaviour. Native-device, assistive-technology and owner visual acceptance remain pending. No additional confirmation dialog is invented.

[Build evidence](../../../testing/evidence/changes-follow-up-build/README.md) separates executed checks, visual differences and limits. Owner visual review remains **pending**, with no reviewer, date or fingerprint copied.
