# Rescheduling and acknowledgement centre — design reference

Stable entry: `scope:PL-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule/changes`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Work queue + persistent detail**. Canonical destination: `/schedule/changes`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select the period, timezone and site, then Needs review, Change requests, Customer follow-up, Cancellations or History / all visits.
2. Select the exact appointment. Compare current versus requested interval, crew roles, explicit travel allowances/reasons and schedule/request versions.
3. Enter a decision reason and use existing Accept and check move, Reject request or Cancel request where permitted. Acceptance reruns booking guards; pending requests reserve nothing.
4. Open appointment controls for move/reassignment, customer contact or cancellation. Review owned follow-up, booking history and contact events separately.

An exact appointment handover stays visible even outside the selected date/queue. Changed booking facts require fresh contact and preparation review. Contact is not delivery or pack acknowledgement.

## Desktop

Keep the bounded coordination queue beside one selected appointment at 1440 x 960 and 1024 x 768. Show current/requested time, crew roles, explicit travel and versions together before a request decision. Customer commitment, dispatch/preparation consequences, owner and history remain separate.

## Mobile

Stack queue, selected review and current/proposed sections at 390 x 844 and 320 CSS px. Requests retain labelled decision reasons and server error/recovery controls. After a saved decision, focus returns to the review heading. Exact appointment handovers are explicitly identified when date/queue filters are bypassed. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

ChangesWorkspaceScreen, the existing RequestDecision control, shared Button/ButtonLink, business-ui fields/read/error states and SchedulingNavigation. Booking commands remain owned by the existing planner service.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. Existing validation, stale-version, saving, uncertain outcome, unchanged retry and success states remain in the authoritative booking controls.

## Handovers and authority

Incoming: period/site/resource queue or exact PL-05 appointment handover. Outgoing: existing appointment move/reassignment/contact/cancellation controls and owned follow-up Activities. Expected appointment/request/resource/calendar versions, original operation receipts and history remain authoritative.

## Visual references and verification

[Scheduling & Appointments r01](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) is a proposed reference. Current authorised work-order demand and appointment contracts supersede its unassigned-proposal example. Retained source bytes are unchanged.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Queue and selected appointment are retained in the page address and in the allowlisted return from appointment controls. Only Open and InProgress follow-up Activities enter Customer follow-up or contribute an outstanding task to Needs review; Completed and Cancelled remain history. An independent pending request, changed commitment or scope review can still require review.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.
