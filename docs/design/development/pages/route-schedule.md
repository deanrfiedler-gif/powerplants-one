# Service planner — design reference

Stable entry: `route:/schedule`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
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

Automatic policy preparation must show failures without moving focus out of a date being edited. Save stays unavailable until complete preparation succeeds; explicit command errors retain normal focus and recovery.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** The planner opened on 22 Sept 2031 rather than the current week. Check whether this follows the seeded booking or a default. S5: each day cell repeats 'Server checks all reservations'. Phone: tabs and filters fill the first screen before any booking appears. The date field showed mm/dd/yyyy in the test browser; confirm on a real Australian device.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Phase 00 refinement boards — 10 October 2026

- **Reference:** the playable Day, Week, Map and phone planner boards on the private [phase 00 refinement canvas](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E), version 159 (`1791622886-4b94`), with their notes board. No capture is retained, and the board sources run only in the Design runtime. Dean's decisions and the open items are in the [decision record](../../../decisions/ui-build-sequence.md#planner-boards-refined-10-october-2026).
- **Status:** design decisions, not built. This scope ID, page type and the existing booking commands, guards and recovery are unchanged. The 9 October visual review above was Refine; this edit marks it stale, as intended.

### Desktop requirements

- **Time range:** the Day timeline runs 07:00 to 18:00. 07:00 to 08:00 and 17:00 to 18:00 are shaded and labelled Extended hours. A visit or its travel inside them is allowed with a warning that names the person and times; outside 07:00 to 18:00 the existing calendar guard refuses it.
- **People column:** avatar level with the name; role beneath, with the full role on hover; then one total, such as "4 of 9 h booked", counting standard hours only. No bars. Free time is hover and screen-reader text. People on leave sit last in a short, dimmed row, with the leave shown once across their lane.
- **Bookings:** title, time and site. Confirmed is faint blue (`#eef4fa`, border `#c8d6e5`), needs attention amber, proposed hatched. The status in words, the travel allowance and extended hours are in the hover text and the snapshot. Crew initials appear only when more than one person is booked.
- **Shape:** neighbouring bookings keep a 4 px gap. A visit and its own travel join with no gap and share one border, with none where they meet. A selected card has a navy border and a soft shadow; one that needs attention takes `#fff5df`, the Pack needed pill's background.
- **Motion:** cards are flat at rest. Hover grows a booking a fixed 3 px on every side, with its travel, with no shadow or border change; Week tiles also rise 1 px. Respect reduced motion.
- **Week:** cells hold only visits and leave or unavailable blocks. How full a day is shows as a soft shading that deepens as the day fills, with hours booked and free time in the cell's hover text. Day headers show one total. Tiles show time and title, with a clock only for extended hours. The weekend is a slim strip while no weekend work is booked.
- **Details:** a selected visit opens as a snapshot in the live Deals snapshot's layout: title and close, work order and status, Visit, Crew and Readiness, then Close and Open appointment. The planner has no help button of its own.
- **Rail:** never scrolls. All 13 Service destinations fit at 44 px with 2 px gaps.
- **Map:** the route list shows each person's name and one total, with visits and free time on hover. Stops show time, title and site; a dashed number means proposed and the map key's amber "!" means needs attention, naming what is needed on hover. Route lines carry no labels; travel shows once, in the list. Pins lift a fixed 3 px on hover.

### Mobile requirements

- People on leave sit last in a short, dimmed row. Each person shows one total; free time is in the day strip's hover text.
- The day strip runs 07:00 to 18:00, with a 2 px gap between neighbouring blocks and travel joined to its visit.
- Cards show time, title and site, faint blue when confirmed and flat at rest. A selected card has a 1 px border (navy, or `#fff5df` when it needs attention) and the soft shadow. Cards grow 3 px each side on hover or press. Initials appear only on shared visits in a person's day, and always in the week list, where cards mix people. A visit in extended hours shows the clock.

### Proposed departures awaiting Dean

The snapshot narrowing the board rather than covering it, and its 360 px width; the hours-booked and free-time calculations; what counts as needing attention; checks shown as you edit; a Day drop that sets the start time; distinct rail icons and a short-window rule; past-time shading; and a map provider, which needs an architecture decision record first. Until Dean decides, these remain proposals.
