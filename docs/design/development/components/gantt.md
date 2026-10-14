# Project Gantt and list

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `gantt` · **Review:** Pending

Actual project timeline with groups, milestones, dependencies, progress, zoom, warnings and list mode.

## Source and reference

Design: [ppo-projects-gantt-content-r10.html](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html). Retained design reference; paired acceptance not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`. The live catalogue links the current checkout and computes dependency fingerprints.

## Desktop

Use Week/Month/Fit, owner and issue filters, group collapse, display options and list mode. The fixed reference date is 23 September 2026.

## Mobile

Inspect the actual list fallback, timeline scroll, long task titles and resize controls at phone width.

## Keyboard and accessibility

Tab/Shift+Tab and visible focus throughout. Use labelled controls as alternatives to dragging and hover-only actions.

## States and interaction

- **Default:** Representative synthetic content and normal interaction.
- **Empty:** No matching example records; absence is distinct from failure.
- **Loading:** Read in progress; no success is inferred.
- **Read only:** Management actions unavailable in this example.
- **Undated:** Inspect the undated variant and its explanatory messages.
- **Programme:** Programme mode over synthetic project context.

## Differences and limits

Task editing and server history are not part of this presentation fixture. Dependency warnings are advisory. Full paired r10 visual acceptance remains open.

## Verification and maintenance

Review at 1440 × 960, 1024 × 768, 820 × 800, 390 × 844 and 320 × 700 where relevant; check browser zoom and keyboard operation separately. Compare the same state and viewport with the retained reference. Record exact commit, reviewer, date, fixture state, viewport, result and evidence paths in the component review record. Automated source fingerprints do not grant acceptance.

Changes to the source, styles, fixtures, specification or reference invalidate prior evidence. Update this master and its component record in the same pull request. Keep app business checks separate from catalogue presentation checks.


## Accepted Sales context (LC-16)

The native Project host supplies an optional Sales handovers action. It opens the existing labelled native-dialog pattern, closes on Escape or explicit close, and retains browser focus return. Exact accepted Sales context and historical revisions are read inside the dialog; the fixed schedule workspace has no extra sibling panel. The initial sibling layout displaced the phone schedule and is retained as failed evidence. Final desktop/phone proof and limits: docs/testing/evidence/won-delivery-continuity/README.md. No paired design acceptance is claimed.
## Baseline and forecast addition — PJ-03

The native host supplies optional `onBaselines`, opening `ProjectBaselines` inside the existing labelled native-dialog pattern. Reuse ProjectsGantt, Button, Field, SelectField, ReadState, ErrorNotice and current task editor. The catalogue fixture exposes the action but explicitly directs users to a saved project; it never fakes server evidence. Saved-host fixtures are `tests/browser/project-baselines.spec.ts`.

Incoming: permitted current schedule plus paged immutable baseline revisions. Outgoing: one original RecordProjectBaseline receipt; task forecast edits remain SaveProjectTask. The comparison uses calendar days and the current visible owner; successor warnings do not automatically move dates or bookings. Read/command denial removes cached content; uncertain writes freeze values for exact retry.

Desktop: retain the fixed schedule underneath an on-demand scrolling dialog. Phone: let the schedule page scroll vertically, preserve a 240–360px task-list viewport, and scroll the action strip horizontally; wrap dialog controls and dates, use single-column comparison cards, visible close and keyboard focus return; no horizontal document overflow. New states: no baseline, undated schedule, recorded baseline, slipped milestone, changed dependency, older history, stale revision, read-only, denied and unknown submission.

Proposed departure: the comparison dialog and successor preview are new compositions, with no exact issued HTML/image. Preserve r10 for the surrounding schedule. Owner and paired visual acceptance are pending; [functional evidence](../../../testing/evidence/project-baselines/README.md) is separate.


## PJ-03 working calendar and actual-date backend

The existing Gantt, task editor and baseline dialog use saved Project calendars for advisory dependency checks. Name the current calendar and revision; preserve calendar-day geometry and the explicitly labelled calendar-day comparison. Weekend shading still marks Saturday/Sunday rather than business availability. The `saved-calendar` catalogue state uses a synthetic 23 September closure. New baselines retain their exact calendar revision; actual-date evidence remains separate from task status/progress.

Incoming: scoped programme/calendar/actual revisions. Outgoing: native task saves and immutable baseline receipts; calendar/actual commands are currently API-only. Reuse ProjectsGantt, ProjectTaskPanel, ProjectBaselines and their existing controls. Existing consumer bindings and r10 reference remain. No exact image for calendar editing or actual-date controls exists; these surfaces and paired acceptance remain open. Desktop and phone must retain scroll, keyboard access, calendar labels and advisory warnings without adding a sibling panel. Functional evidence: `docs/testing/evidence/project-programme/README.md`; source presence is not deployment or visual acceptance.

Change history distinguishes calendar, actual-date, task and acceptance events; it must not label every Project version as a task save. Desktop/phone native-host proof covers those labels.

## Figma colour set — 14 October 2026

Dean chose the Figma Gantt colours over the r10 colours: "Regarding the Gantt chart, I think I like the Figma version more." The [decision](../../../decisions/gantt-figma-colours.md) maps each Figma variable to a `--gantt-*` or status token defined on `#ppo-gantt-page`, and the [rendered evidence](../../../testing/evidence/gantt-figma-colours/README.md) shows before and after. Bars use green for complete, blue for in progress, orange for at risk and grey for planned. Milestones are outlined when planned and green when complete, phase summary bars are grey, and the today marker is purple, a colour no status uses. The legend gains Planned and Today.

r10 geometry and behaviour are unchanged. The Figma Overdue state is not built, because the application has no Overdue status and deriving one needs an owner decision. The conflicted-task state is kept as built, because the Figma Schedule frame does not draw it. Status is carried by colour and outline only, as in both designs, so a text or icon cue for each status remains a possible refinement. The review above stays Pending.
