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

## Accepted design implementation

The D1–D6 implementation uses `SecondaryMenuFrame` with `data-ppo-workspace="shared"`, existing Day/Week and booking controls, a source-derived Needs attention band and a 44 px collapsed tray. The move form compares current/proposed times and crew and warns about new site readiness; existing expected versions, policy preparation, refusal and unchanged uncertain retry remain authoritative. The phone details stay above the tab bar; Needs attention and tray has a return control. No migration, capability, grant or dependency is added.

Differences from the frames: On hold contains held visits rather than invented work-order hold states; reasons are exact native gate narratives when permitted, otherwise reason unavailable. There is no hold expiry, suggestion read or timed automatic return. Review appointment is the one handover per attention row. Existing policy, crew/travel, version and recovery controls remain in Plan visit and Move, so those forms are longer than the compositions. Native filters retain Appointment state and alternate timezone/list support. Synthetic seed names/counts and fallback icons differ. See [implementation evidence](../../../testing/evidence/service-planner-build/README.md) for verification and the remaining visual comparison.

The historical 9 October owner review below is retained as evidence but is stale for these changed sources. No fingerprint is copied. Functional proof, inspected visual comparison, owner acceptance and deployment are separate.

## Desktop

Accepted design: the [Service planner design decision](../../../decisions/service-planner-figma-design.md) of 17 October 2026, with captures 01–05 (desktop 1440 × 960) and 06 (tablet 1024) in [design r01](../../../reference/ui/service/service-planner-design-r01/README.md). UXB-12 is adopted for this page.

- **Layout:** the Scheduling views sit in the side menu, collapsed on the planner (D1). A toolbar holds date navigation, Today, Day and Week, Site and People filters and the time zone (D2). A Needs attention band names the cause and one suggested action per row, including the field readiness gate's dispatch holds (D3). A tray with To plan and On hold sits beside the board and collapses to a 44 px strip while details are open and on tablets (D4).
- **Cards:** title, time and site in 12 px type inside one border; crew initials in the time line, only on shared visits; no reason line. Travel is a muted tint of the visit's colour inside the same border, with a muted car on segments of 30 minutes or more. Attention cards carry an amber warning icon.
- **People:** pastel purple circle avatars, the role and one total. Away or inactive people sit last in full-height dimmed rows.
- **Moves:** a drop opens Move this visit?, comparing current and proposed times and warning when a new site readiness confirmation is needed (D5). Desktop frames are 1440 × 960 (D6).
- The accepted layout is implemented in draft. The band reads existing gate reasons. To plan remains authorised unassigned work; On hold contains held visits in the current planner filter. Work orders have no typed hold status or release date; no cause or expiry is invented. Suggestions remain excluded.

Day/week resource lanes keep date, display timezone, site and resource filters visible. Unassigned authorised work remains distinct from Proposed visits. At 1440 x 960 and 1024 x 768, review named lanes, calendar evidence and travel reservations before opening the existing booking panel.

## Mobile

Accepted design: captures 07–12 in [design r01](../../../reference/ui/service/service-planner-design-r01/README.md). Day at 390 and 320 has day chips and person cards with a strip. There is also a Week list, the visit details sheet above the tab bar, and a Needs attention and tray page reached from a tray row. Phone cards keep a 14 px title. Four states are drawn: loading, empty day, no access and last good read after a failure.

At 390 x 844 and 320 CSS px, use Day for a compact list or keyboard/labelled lane navigation for Week. Filters and long resource labels wrap; booking panels retain validation, focus return and same-tab recovery. The shell owns vertical content scrolling; week lanes retain their bounded horizontal comparison. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

PlannerBoard, AppointmentCard and existing booking/request controls; shared shell, SchedulingNavigation and business-ui fields/read states. Existing planner buttons retain their scoped legacy styles.

Loading and transient failed reads can retain a labelled last successful board with moves disabled and current counts unknown. Denied and changed-scope reads remove prior evidence. Words identify Unknown and source completeness. Existing validation, stale-version, saving, uncertain outcome, unchanged retry and success states remain in the authoritative booking controls.

## Handovers and authority

Incoming: permitted authorised work-order demand, current appointment/resource/calendar versions. Outgoing: existing Plan visit, readiness, contact, confirmation, controlled move and cancellation commands; exact resource detail links. Request decisions compare saved and proposed facts.

## Visual references and verification

Accepted Figma design: [Service planner design r01 captures](../../../reference/ui/service/service-planner-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/service-planner-figma-design.md). Images of the Map view, the other Scheduling views, the phone Filters sheet and hover states are still missing.

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

## P4/P5 backend consumer note — 24 October 2026

[PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690) implements the authorised backend/API slice in draft. The [service API amendment](../../../contracts/service-api.md) defines typed contact checks and the narrow preparation projection. UI wiring of the accepted P4/P5 designs is a separate follow-up; existing unavailable-state copy remains until that work is accepted and built. This note adds no visual-review evidence or acceptance claim.
