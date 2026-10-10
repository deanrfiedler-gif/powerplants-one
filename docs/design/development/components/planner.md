# Resource scheduling lanes

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `planner` · **Review:** Pending

Actual day/week resource lanes, appointments, calendar evidence, availability blocks and reserved periods.

## Source and reference

Design: [powerplants-one-theme-style-board-r22.html](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html#gantt). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Day and Week share the same fixture. A drop proposes a move; the host still owns conflict, readiness, crew and authority checks.

## Mobile

Each lane scrolls independently in Week. Day provides the simpler narrow-screen alternative.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Week:** Seven-day resource lane view, with a continuing synthetic closure from 24 September 23:00 to 27 September 00:00 Australia/Sydney. It appears on 24, 25 and 26 September only; the end boundary is exclusive.
- **Empty:** No matching example records; absence is distinct from failure.
- **Read only:** Management actions unavailable in this example.

## Differences and limits

This planner is not the project Gantt. Catalogue callbacks do not prove conflict enforcement or saved booking behaviour.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.

## Scheduling consumers

PL-01 retains the existing PlannerBoard and appointment cards. Resource headings now link to scoped availability and competence evidence. The new long-label fixture exercises wrapping alongside the existing week, empty, proposed and read-only states. PL-02 to PL-05 use separate native compositions and do not claim this component as a direct consumer. See [Scheduling evidence](../../../testing/evidence/scheduling-resources/README.md); visual acceptance remains pending.

The post-merge closure correction uses interval intersection in the display timezone, so a closure beginning before a day remains visible on that day. The existing `scope:PL-01` and `route:/schedule` consumer bindings remain exact. [Refinement evidence](../../../testing/evidence/scheduling-refinement/README.md) records checks separately from owner review.

## Scheduling Step 4

The `policy-hold` catalogue fixture keeps the original appointment and reservation visible and names a published scheduling hold. It does not simulate resolution authority. The host prepares the proposed interval using exact policy/published-head evidence; the server rechecks every save. Controlled moves retain the historic pin. New holds and stale resolutions remain distinct from customer contact, preparation and pack acknowledgement.

Review policy preparation and impact reason/owner/publication at desktop and 390/320 px. Shared Button, fields, ReadState and ErrorNotice retain their contracts; legacy planner buttons remain an existing exception. There is no issued Step 4 mockup. Owner visual/device acceptance is pending. See `docs/testing/evidence/scheduling-policy-enforcement/README.md` for actual functional evidence; no review fingerprint is granted.

Automatic policy preparation must show failures without moving focus out of a date being edited. Save stays unavailable until complete preparation succeeds; explicit command errors retain normal focus and recovery.

## Working hours (10 October 2026)

The catalogue resource calendar now publishes 07:00 to 18:00, like the sample calendars. A confirmed card in a lane shows Extended hours when its visit and that person's travel fall outside the 08:00 to 17:00 standard hours; see the appointment component. The lane's calendar text still shows the published interval only. Standard hours are a fixed rule from [Dean's decision](../../../decisions/ui-build-sequence.md#planner-working-hours-10-october-2026), not calendar data.

## Day timeline (10 October 2026)

`PlannerTimeline` draws the Day view as a 07:00 to 18:00 timeline and `AppointmentSnapshot` is the details panel a selected visit opens. They follow the phase 00 refinement boards ([decision](../../../decisions/ui-build-sequence.md#planner-day-timeline-10-october-2026)). The default catalogue state shows them with a fixed Now of 10:40; Week keeps `PlannerBoard`. The calculations (axis, bands, hours booked, free time, needs attention) are in `src/scheduling/day-timeline.ts` with unit tests. No owner visual review yet.

## Week board (10 October 2026)

`PlannerWeek` draws the Week view as the stripped-back board: one row per person, one column per day, load shading, slim weekend strips, compact tiles and the shared details panel ([decision](../../../decisions/ui-build-sequence.md#planner-week-board-10-october-2026)). The `week` catalogue state shows it; the new `lane-list` state shows `PlannerBoard`, which narrow screens and other display timezones still use. No owner visual review yet.
