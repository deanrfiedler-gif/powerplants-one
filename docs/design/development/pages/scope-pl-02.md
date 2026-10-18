# Resource availability and competence — design reference

Stable entry: `scope:PL-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/technicians`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

## Desktop

Accepted design: the [Field team design decision](../../../decisions/field-team-figma-design.md) of 18 October 2026, with captures 01–02 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/service/field-team-design-r01/README.md).

- **Register:** the Work orders grid, one row per person (D1). Columns: Technician, Role, Hours today, Competence (each skill's state for the seven days from the selected day), Visits today, First scheduled visit, Resource status, Time zone, Calendar and Coordinator handover. The toolbar keeps Search technicians, the day, All permitted sites, the time zone, the read time and Refresh.
- **Views:** Technicians (default, Q1), Visits and Needs preparation in the side menu, then a People group with Active, Away today, Inactive and Competence to review (D2).
- **People:** the planner's purple avatar, role and one total, with no bars; people on leave or inactive sit last, dimmed (D3). The role and the hours total are build prerequisites (Q3, Q4).
- **Snapshot:** a row opens the large snapshot with View visits and Availability & competence (D4).
- **Shell:** the proposed Conversations action sits left of the information icon (D8).
- Nothing new is built.

Accepted design: the [Field team design decision](../../../decisions/field-team-figma-design.md) of 18 October 2026, with captures 03–04 in [design r01](../../../reference/ui/service/field-team-design-r01/README.md).

- **Layout:** the Work order record layout as one scrolling page (D5): a header with role, resource version, base time zone and position; an Evidence bar for the seven days; a details column with Summary, Published calendar and Permitted sites.
- **Review window:** Week starting (the incoming day, Q2), Review time zone and Refresh evidence, with the read time and completeness. Source editors are not available.
- **Availability:** one 07:00–18:00 track per day with shaded extended hours, visits with their travel, proposed visits, leave, days with no published hours, busy time without details and a total per day (D6).
- **Competence and evidence:** the `competenceState` words for the window, source status, validity and review evidence; Review evidence opens a read-only side panel (D7). Certificate and renewal evidence reads Unknown.
- **Upcoming visits:** permitted appointments, opening Appointment detail.
- Nothing new is built.

Keep the accepted Field Team Visits, Technicians and Needs preparation views. Availability & competence opens a specific resource. Detail uses paired overview/calendar cards, skill evidence, then reservations and permitted commitments; resource identity, seven-day window and source versions stay explicit.

## Mobile

Accepted design: captures 06, 07 and 10 in [design r01](../../../reference/ui/service/field-team-design-r01/README.md). List rows with the avatar, name and one total, the role and today's visits, and one status line with an icon. The date, read time and refresh stay reachable at 390 and 320 px. Field team is reached from More. Five states: loading, no matches with removable filter chips, could not load, view only, and an incomplete result.

Accepted design: captures 08–10 in [design r01](../../../reference/ui/service/field-team-design-r01/README.md). The review-window controls come first, then availability as thin day strips, competence, upcoming visits, permitted sites, and the resource and calendar fields; the resource ID wraps. The view-only state shows busy time without details.

Stack resource evidence cards without hiding interval, validity or unknown-evidence text. Date and refresh controls remain reachable at 390 x 844 and 320 CSS px. Long UUIDs and hashes wrap. Existing Field Team filters and record navigation remain available. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

FieldTeamScreen, ResourceWorkspaceScreen, shared shell/SchedulingNavigation, Field, ReadState, Stamp and Button. No operational source editor is introduced.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: exact permitted resource identity and selected review date from Planner or Field Team. Outgoing: permitted site/appointment records and retained booking history. Source publication history beyond the returned bundle, certificates and renewal evidence remain unavailable/Unknown.

## Visual references and verification

Accepted Figma design: [Field team design r01 captures](../../../reference/ui/service/field-team-design-r01/README.md) (ten icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/field-team-figma-design.md). Images of the Visits and Needs preparation views in this layout, desktop register states and hover states, the open date picker, the phone evidence sheet and the tablet person page are still missing.

[Field Team r04](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r04.html) is the retained predecessor; the accepted successor is [r05](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05.html), whose [change record](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05-change-record.md) records that acceptance. Native parity remains a separate review. No exact issued resource-detail mockup exists.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Field Team now honours incoming day, site and display timezone and retains those controls on reload. Its default without a date remains today. Availability & competence and Back to Field Team retain day/site/timezone. Resource detail exposes a Review timezone selector for its seven-day window; published calendar timezone remains explicit and unchanged. No source editor is added.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.
