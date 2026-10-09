# Service planner and unassigned demand — design reference

Stable entry: `scope:PL-01`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Planning workspace**. Canonical destination: `/schedule`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a day/week, display timezone and permitted site or resource. Working hours, anonymous busy reservations and travel buffers remain separate from visit times.
2. From authorised unassigned demand choose Plan visit. Preserve the work-order version and site time; save the proposal, review readiness, record contact, then confirm eligible crew with explicit travel values and reasons.
3. Use Move or reassign as the keyboard alternative to drag. Compare the exact saved booking and proposed interval/crew before submitting. Open a resource name for availability and competence evidence.
4. Use Changes & follow-up, Travel review or Demand & capacity in the Scheduling navigation.

Existing same-tab booking recovery and server commands are preserved. Request decisions now show current versus proposed time, named crew, travel and version differences.

## Desktop

Day/week resource lanes keep date, display timezone, site and resource filters visible. Unassigned authorised work remains distinct from Proposed visits. At 1440 x 960 and 1024 x 768, review named lanes, calendar evidence and travel reservations before opening the existing booking panel.

## Mobile

At 390 x 844 and 320 CSS px, use Day for a compact list or keyboard/labelled lane navigation for Week. Filters and long resource labels wrap; booking panels retain validation, focus return and same-tab recovery. The shell owns vertical content scrolling; week lanes retain their bounded horizontal comparison. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

PlannerBoard, AppointmentCard and existing booking/request controls; shared shell, SchedulingNavigation and business-ui fields/read states. Existing planner buttons retain their scoped legacy styles.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. Existing validation, stale-version, saving, uncertain outcome, unchanged retry and success states remain in the authoritative booking controls.

## Handovers and authority

Incoming: permitted authorised work-order demand, current appointment/resource/calendar versions. Outgoing: existing Plan visit, readiness, contact, confirmation, controlled move and cancellation commands; exact resource detail links. Request decisions compare saved and proposed facts.

## Visual references and verification

[Scheduling & Appointments r01](../../../reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) is a proposed reference. Current authorised work-order demand and appointment contracts supersede its unassigned-proposal example. Retained source bytes are unchanged.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Calendar closures span every intersecting day in the display timezone, including a continuing closure that starts before the visible day. The end boundary is exclusive. Published working intervals and busy reservations remain independent; this display correction changes no booking guard.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** Follows the planner.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
