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

Accepted design: the [Changes and follow-up design decision](../../../decisions/changes-follow-up-figma-design.md) of 18 October 2026, with captures 01–06 (desktop 1440 × 900) and 08 (tablet 1024) in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md).

- **Queues:** the five queues are side-menu views with counts under "Changes & follow-up"; Policy impact, Travel review and Demand & capacity sit under "Reviews" (D1). Counts follow the selected period and site (Q3).
- **Register:** a Changes grid with Visit, Work, Needs review because, Booked, Requested, Customer, Follow-up and Site; a row opens the PL-02 large snapshot with previous and next (D2). An exact appointment from Travel review shows a banner and stays visible when the period and queue would hide it.
- **Selected visit:** the booking now, crew, travel and versions, then what a change sets in motion: customer contact, job pack re-acknowledgement, site readiness (gate P4) and dispatch holds (D3). Change request, Follow-up and History tabs; each changed value is named in words.
- **Decisions:** Decision reason, Accept and check move and Reject request, as built; Cancel request sits in the request card's "…" menu (Q1). A stale request names what changed since it was made and does not block on its own (D4).
- **Follow-up:** owned follow-up activities with owner, due time and state, then recorded customer contact; "Record customer contact" opens the existing SV-04 control (D5). After an accepted move it is the primary action (Q4).
- **Policy holds** stay out of Needs review and show in the planner's Needs attention band (Q2).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Implementation is in progress; owner visual review remains pending.

Accepted design: the [Changes and follow-up design decision](../../../decisions/changes-follow-up-figma-design.md) of 18 October 2026, with capture 07 in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md).

- **Layout:** a Review / comparison page in the Changes and follow-up workspace, with Policy impact selected under "Reviews" in the side menu (D7).
- **Published rule:** maximum visit, effective since, sites and policy version, beside a Temporary comparison form with proposed effective time, proposed maximum visit in minutes and site restriction, then Compare with bookings.
- **Bookings requiring review:** a table of Visit, Work, Booked, Length and Effect if published, with the effect in words and the count, period start and read time above it. Each visit opens its booking in the queue.
- The comparison changes no rule and no booking; publishing stays a separate, controlled step.
- Implementation is in progress; owner visual review remains pending. The saved proposal, review and publication workspace on this route is not drawn.

Keep the bounded coordination queue beside one selected appointment at 1440 x 960 and 1024 x 768. Show current/requested time, crew roles, explicit travel and versions together before a request decision. Customer commitment, dispatch/preparation consequences, owner and history remain separate.

## Mobile

Accepted design: captures 09–12 in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md). The title is "Changes"; the queue is list rows in the PL-02 phone pattern. The review is one scroll: the request card first, with Booked now and Requested as stacked blocks, "Changed" tags, the decision reason and full-width buttons; then the consequences, Booked now and history. At 320 px Move or reassign moves into More (D6). Four states: loading, empty queue, could not load, and view only.

Accepted design: none at phone width. Policy impact on a phone is not drawn in [design r01](../../../reference/ui/service/changes-follow-up-design-r01/README.md); the requirements below stand.

Stack queue, selected review and current/proposed sections at 390 x 844 and 320 CSS px. Requests retain labelled decision reasons and server error/recovery controls. After a saved decision, focus returns to the review heading. Exact appointment handovers are explicitly identified when date/queue filters are bypassed. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

ChangesWorkspaceScreen, the existing RequestDecision control, shared Button/ButtonLink, business-ui fields/read/error states and SchedulingNavigation. Booking commands remain owned by the existing planner service.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. Existing validation, stale-version, saving, uncertain outcome, unchanged retry and success states remain in the authoritative booking controls.

## Handovers and authority

Incoming: period/site/resource queue or exact PL-05 appointment handover. Outgoing: existing appointment move/reassignment/contact/cancellation controls and owned follow-up Activities. Expected appointment/request/resource/calendar versions, original operation receipts and history remain authoritative.

## Visual references and verification

Accepted Figma design: [Changes and follow-up design r01 captures](../../../reference/ui/service/changes-follow-up-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/changes-follow-up-figma-design.md). The named version "Changes and follow-up — accepted" is saved. Images of the Cancellations and History / all visits rows, a tablet snapshot, the Cancel request menu, saving, uncertain-outcome and unchanged-retry states, Policy impact on a phone and the saved policy proposal, review and publication workspace are still missing.

[Scheduling & Appointments r01](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) is a proposed reference. Current authorised work-order demand and appointment contracts supersede its unassigned-proposal example. Retained source bytes are unchanged.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Queue and selected appointment are retained in the page address and in the allowlisted return from appointment controls. Only Open and InProgress follow-up Activities enter Customer follow-up or contribute an outstanding task to Needs review; Completed and Cancelled remain history. An independent pending request, changed commitment or scope review can still require review.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## Policy impact comparison

The secondary `/schedule/policy-impact` route uses the r20 Review / comparison page type within PL-04. It compares a temporary duration/effective-time proposal with permitted future Confirmed bookings and hands exact appointments back to this queue. No policy, booking, document or owned task is saved. The [page-specific contract](route-schedule-policy-impact.md) records its proposed native composition, missing exact mockup, shared controls and desktop/mobile requirements. Publication remains separate.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

## Step 5 native policy evidence host

The existing PL-04 policy-impact route adds `PolicyPublicationWorkspace` for immutable proposal/successor, complete server review, exact publication, stable reopening and original-operation recovery. It retains the Review / comparison classification described in the policy-impact page contract. `PolicyHolds` and the existing appointment `PolicyResolution` retain their roles. No second resolution mechanism is added.

Host state fixtures are exercised against task-owned synthetic PostgreSQL by `tests/scheduling-browser/publication.spec.ts`: proposal, successor/original, complete empty/compliant/affected review, over-limit refusal, stale publication, accepted publication, uncertain response/reload, revoked/switching identity and typed owned handovers. These are host integration examples, not an isolated runnable gallery or accepted mockup. Desktop and phone requirements and exact evidence are in `docs/testing/evidence/scheduling-policy-interface/README.md`.

Reuse the shared online journal with an opt-in receipt check for server-allocated publication IDs; all other consumers retain their exact record-ID check. The journal never defines saved evidence, automatically posts on reload or clears an appointment hold. Owner/visual/device review and the component alignment item remain pending.

## Step 6 functional evidence

[Integrated execution and release map](../../../testing/evidence/scheduling-step6/README.md) and [owner walkthrough](../../../delivery/scheduling-step6-owner-walkthrough.md) add update/restart/rollback and Service/Finance handovers. Scope, page type, reused components, incoming/outgoing bindings and implementation are unchanged. No new accepted mockup exists; visual/guide/component review remains pending and no fingerprint is adopted.

## NAV contextual navigation

Scheduling change follow-up has its own breadcrumb and retains the shared secondary-menu view, day/timezone/site/resource query contract.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.


## Accepted design implementation

The PL-04 implementation covers the existing Changes and Policy impact routes. See the [Changes contract](route-schedule-changes.md) for every accepted frame ID, states, components and open questions, and the [Policy impact contract](route-schedule-policy-impact.md) for the temporary comparison and retained saved-policy workflow. Named version: **Changes and follow-up — accepted**, file **PPO - Design**, page `1326:4525`, notes `1335:3505`. [Build evidence](../../../testing/evidence/changes-follow-up-build/README.md) records execution separately from owner visual review, which remains pending.
