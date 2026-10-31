# Service planner — design reference

Stable entry: `route:/schedule`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Planner summary actions retain the same current company/Site-scoped Supply read flag as the appointment detail. This permits an exact summary/detail contract comparison without exposing Supply detail narratives or granting an action. `tests/database/quality-planner.test.ts` compares the complete action set for coordinator, Site observer and assigned technician and rechecks changed access.

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

## Working hours built — 10 October 2026

Dean's working hours ([decision](../../../decisions/ui-build-sequence.md#planner-working-hours-10-october-2026)) are built in the existing screens. No layout changes.

- **Desktop and mobile booking form:** under the crew rows, an Extended hours panel in the existing `planner-warning` style appears when a person's visit or travel falls outside 08:00 to 17:00 in their calendar timezone. It states the standard hours, then one line per person with the times. It updates as times, crew or travel change, is announced as a status and never blocks a save.
- **Planner lanes:** a confirmed card in a person's lane adds the line "Extended hours · 07:30 to 12:30 including travel" in the warning colour, and its accessible name adds "extended hours". Proposed and cancelled cards are not marked.
- **Calendar text:** lanes show the published interval, now 07:00–18:00 in freshly seeded data. Older seeded databases still show 08:00–17:00.
- **Evidence:** [checks and captures](../../../testing/evidence/planner-working-hours/README.md): unit tests for the rule, a database test that travel can reach 07:00 and 18:00 but not a minute beyond, and element captures from a task-owned server. Visual review stays pending.

## Day timeline built — 10 October 2026

Stage 1 of building the refinement boards, on Dean's "Yes to both, proceed with your recommendations" ([decision](../../../decisions/ui-build-sequence.md#planner-day-timeline-10-october-2026)). Week, phone and Map follow in later stages.

- **Where it shows:** Day view at 781 px and wider, when the display timezone is the resources' calendar timezone. Narrower screens keep the existing day list until the phone layout is built. With another display timezone the list shows, with a note to switch.
- **Layout:** a sticky people column (avatar, name linking to the technician, resource type, one total such as "2 of 9 h booked"; free time in hover and screen-reader text) beside a 07:00 to 18:00 axis with hour labels, half-hour labels when there is room, and a Now pill and line on today.
- **Lanes:** hour and half-hour hairlines. Inside the calendar but outside 08:00 to 17:00 is shaded Extended hours; outside the calendar is hatched Not working. Unavailable time, leave and closures are hatched blocks naming the kind and times. Every reservation the server returns shows as a faint hatched underlay, so time booked under a filter is never drawn as free. Time already gone today has a very light wash.
- **Visits:** placed by time, with the person's travel joined either side and a 4 px gap to neighbours. Title (scope summary), time and site; initials only when shared. Faint blue confirmed, amber needs attention, hatched proposed. Hover text names the status, travel and extended hours. Flat at rest; hover or keyboard focus grows the visit and its travel a fixed 3 px on every side.
- **Details panel:** clicking a visit, or Enter or Space on it, opens a 360 px panel: title and close, work order and status, Visit (S6 date range, site, appointment), Crew (role and travel), Readiness (customer contact, job pack, scope, policy, dispatch), then Close, Move or reassign and Open appointment. Focus moves to the panel heading and returns to the visit; Escape closes it.
- **Drag:** a confirmed visit dragged along the timeline proposes the start time where it lands, snapped to 15 minutes, and opens Move or reassign with the crew unchanged. The keyboard route is the details panel.
- **People who cannot be booked** (inactive, or away for the whole of standard hours) move to short rows at the bottom.
- **Shared components:** `PlannerTimeline` and `AppointmentSnapshot` in `src/scheduling/components/client/planner-timeline.client.tsx`; calculations in `src/scheduling/day-timeline.ts`; styles in `src/app/globals.css`. Booking commands, guards and recovery are unchanged.
- **Evidence:** [checks and captures](../../../testing/evidence/planner-day-timeline/README.md). No owner visual review yet.

## Week board built — 10 October 2026

Stage 3 of building the refinement boards ([decision](../../../decisions/ui-build-sequence.md#planner-week-board-10-october-2026)). Same conditions as the Day timeline: 781 px and wider, display timezone matching the resources' calendars; otherwise the lane list.

- **Columns:** a sticky people column and one column per day. Each day heading is a button that opens that day in the Day view, and shows the team's total, such as "6 of 54 h booked", with a Today chip on today. Weekend days are 24 px hatched "S" strips while nothing is on them.
- **People:** name, resource type and the week's total, such as "3 of 45 h booked". People away all week, and inactive people, sit last in short rows with one line across the week.
- **Cells:** only visits and unavailable time. How full the day is shows as a soft navy shading that deepens with hours booked; hours and free time are in the cell's hover and screen-reader text. Unavailable time, leave, closures and filter-hidden reservations are hatched blocks naming the kind and times.
- **Tiles:** time and title, crew initials only when shared, a clock only for extended hours. Faint blue confirmed, amber needs attention, hatched proposed. Hover text names the status and travel. Tiles grow 3 px each side and rise 1 px on hover or focus.
- **Details and moves:** a tile opens the same details panel as the Day view (Enter or Space too). Dragging a confirmed tile to another day keeps its time and opens Move or reassign, as before.
- **Evidence:** [checks and captures](../../../testing/evidence/planner-week-board/README.md). No owner visual review yet.

## Phone layout built — 10 October 2026

Stage 4 of building the refinement boards ([decision](../../../decisions/ui-build-sequence.md#planner-phone-layout-10-october-2026)). Below 781 px, when the display timezone is the resources' own; otherwise the lane list.

- **Controls (phase 00 finding: "tabs and filters fill the first screen"):** the Scheduling tabs are one scrolling row; the date, Day/Week, Refresh and a Filters button stay in view, and the display timezone, Work orders and the three filters fold behind Filters, which shows how many are set. The four counts are one compact row. The first person's card now starts on the first screen at 390 × 844.

- **Day:** chips for the week's weekdays (and weekend days with visits), each with its visit count; an attention row ("2 proposed · 1 needs attention") that jumps to the Proposed and cancelled list; then one card per person: avatar, name and one total; a 07:00 to 18:00 strip showing extended or not-working ends, unavailable time, travel, visits by status and the Now tick, with free time in its accessible name and hover text; then the person's visit cards. People away or inactive sit last in short rows.
- **Week:** one section per day, its heading opening that day, with the team's total; visit cards for everyone that day, with crew initials always shown because the list mixes people. Weekend days with nothing on them are short.
- **Cards:** time, title and site; faint blue confirmed, amber needs attention, hatched proposed; a clock for extended hours. They grow 3 px each side and rise 1 px on press.
- **Details:** the shared details panel as a bottom sheet above the shell's navigation, with Close, Move or reassign and Open appointment.
- **Evidence:** [checks and captures](../../../testing/evidence/planner-phone-layout/README.md). No device or owner review yet.

## Opens on today — 15 October 2026

Audit finding PRJ-2, and the 9 October review finding above ("opened on 22 Sept 2031 rather than the current week"). It was a default: `plannerContext` fell back to the fixed synthetic anchor 2031-09-22 from ADR-0030.

- **Default:** without a valid `day` the planner, and every Scheduling workspace that reads the same context, opens on today in the selected display timezone. An explicit `day` in the address is unchanged.
- **Today button:** after the next-period arrow in the date group, in the existing secondary style. It sets the starting date to today in the display timezone and keeps the view, timezone and filters. On the phone it stays in view with the date row; at 390 px it fits on that row, and narrower screens wrap it under the date.
- **Seeded data:** the synthetic visits remain in the week of 22 September 2031. Specs that read them now open `/schedule?day=2031-09-22`.
- **Evidence:** a `booking-recovery` unit case for the default by timezone, and SC-07 in `tests/browser/planner.spec.ts` for the button, run on desktop and mobile against a task-owned server. There is no owner visual review yet, and 320 px was not captured.

## First board without layout shift (F13) — 16 October 2026

Unassigned demand stays out of the layout until the first schedule read settles, then appears together with the board. Before, the board arrived above it and pushed it out of view, a shift of about 0.18 at 1440 × 900. The demand read still starts when the page opens; a failed schedule read still shows demand with its own state, and later filter or day changes keep it in place. Fixture: `tests/browser/shell-loading.spec.ts` (F13), with the shell record in [shell](../systems/shell.md). No layout, control or copy change; owner review is pending.

## Controls stay put when the shell context arrives late (F13) — 17 October 2026

The Scheduling workspace tabs keep their row while the shell context loads, with a hidden placeholder of the same height, and the rail's More button waits for the context instead of dropping into place. Before, when the identity read settled before the shell context, the Planner painted without the tabs; when the context arrived the tabs pushed the controls and filters down 77 px in the frame where More moved 702 px. That frame scored 0.146 against the 0.1 budget (0.144 in a CI-like diagnostic run); it now scores about 0.006. An identity without the Planner permission still sees no tabs once the context arrives. Fixture: "F13 Planner controls stay put when the shell context arrives after the page" in `tests/browser/shell-loading.spec.ts`; measurements in the [shell record](../systems/shell.md#planner-and-more-when-the-shell-context-arrives-late-f13-follow-up--17-october-2026). No layout, control or copy change in the loaded state; owner review is pending.
