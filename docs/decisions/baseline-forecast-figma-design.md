---
document_id: PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 9dad9aa5d205844412681c07b86e93e6daefd78d
versioning: git
---

# Baseline, forecast and dependency review design — owner decision

On 19 October 2026 Dean asked which remaining page would be the most complex to design. Claude named PJ-03, Baseline, forecast and dependency review. Dean asked for a plan ("Generate a detailed plan that outlines how you would design and build the UI page in Figma for the PJ-03, Baseline, forecast and dependency review module.") and then: "Yes, start drawing the PJ-03 page in Figma following your plan and recommendations."

PJ-03 adds no route. It extends the accepted Project record page ([decision](project-record-page-design.md)), in its Schedule and Baselines views, with a task panel and a working-calendar drawer. It also extends the Programme view at `/projects/programme`.

Claude drew the page from these sources:
- the PJ-03 design register page ([scope-pj-03](../design/development/pages/scope-pj-03.md)), the Programme page ([route-projects-programme](../design/development/pages/route-projects-programme.md)) and the draft guide `guide.pj.03` ("Schedule movement can be explained against a preserved baseline");
- [Project schedule baselines](project-schedule-baselines.md) (migration 0081, IF-PJ-BASELINE-01, AC-PJ-BASELINE-01 to 04, PPO-PJ-CALENDAR-01);
- [Project working calendars and actual dates](project-calendars-actuals.md) (migration 0088, PPO-PJ-CALENDAR-02);
- the material-change receiving records that withdraw forecasts: [single task](quotation-material-resolution.md), [dependency](quotation-task-dependency.md), [chain](quotation-task-chain.md), [branch](quotation-task-branch.md), [merge](quotation-task-merge.md) and [diamond](quotation-task-diamond.md);
- the built code: `src/projects/baselines.ts`, `baseline-model.ts`, `programme.ts`, `calendar-model.ts` and `model.ts`, and the components `projects-gantt.tsx`, `project-task-panel.tsx` and `project-baselines.tsx`;
- copies of accepted designs: the Project record page (Schedule, Baselines and Record baseline frames), the Projects register, the PJ-05 tabs and the PJ-08 top bar and Update settings panel.

During the work Dean gave five further directions:
- **Layout.** "You may want to review how you have laid out the pages you have build so far, as they don't seem to align with the template, some look like they are overlapping, etc." The page was re-laid out to the Template.
- **Calendar windows.** On the large calendar dialogs Dean asked whether to attach them to the top edge. Claude recommended a right-hand drawer, and Dean replied: "I am happy for you to proceed however you believe would make the pages look as professional as possible."
- **Programme header.** Dean asked to polish the Programme table header. After two rounds about the year labels he said: "You have full creative control to refine the design however you believe is the most professional and aligns with industry best practices." He then asked for the Today line to start at the bottom of the Today pill.
- **Audit.** "Now give all the pages an audit and polish. Determine if there are any gaps, if any refinements or improvements can be applied, if any new and innovative features can be added, and if it can be made more professional."
- **Prototype.** "You can take control of my computer and play the prototype now to ensure everything is correct and the pages are as professional as possible."

Finally he accepted the design: "I accept the Baseline, forecast and dependency review PJ-03 design with your recommendations, including D1–D11 and Q1–Q8. Lock it in." That adopts D1–D11 and the recommended answers to Q1–Q8.

Scope:
- `scope:PJ-03` "Baseline, forecast and dependency review": the Schedule and Baselines views of `/projects/[id]`, the task panel, the working-calendar drawer, and `/projects/programme`.
- Parent requirements PRJ-02, PRJ-04 and PRJ-07 (BP-01) and BP-06 J2; acceptance AC-PJ-BASELINE-01 to 04; interfaces IF-PJ-BASELINE-01, `/api/v1/projects/:id/calendar` and `/api/v1/projects/:id/tasks/:taskId/actuals`. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, calendar data or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PJ-03 in Figma, following the plan | User decision, 19 October 2026 | Dean's request quoted above |
| Re-lay out the page to the Template | User decision, 19 October 2026 | Quoted above. Section 5 |
| Working calendar as a right-hand drawer | User decision, 19 October 2026 | Quoted above; Claude's recommendation adopted. D3 |
| Programme header refinement | User decision, 19 October 2026 | Quoted above. Section 5 |
| Audit, polish and new features | User decision, 19 October 2026 | Quoted above. D9–D11 and Q7–Q8 came from this pass |
| Play the prototype | User decision, 19 October 2026 | Quoted above. Section 6 |
| Departures D1–D11 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which count opens first on Baselines | Resolved as recommended | Calendar days, matching the accepted key dates strip, with working days one tap away. The frames show working days only to illustrate the second count |
| Q2 Which calendar counts working days when a baseline used an older calendar | Resolved as recommended | Today's calendar, named on every count. Each baseline keeps its own calendar for its own record |
| Q3 Who can change the working calendar | Resolved as recommended | The project's current coordinator only, as built (`programme.ts`) |
| Q4 Whether a forecast date on a nonworking day counts as a schedule issue | Resolved as recommended | Yes, as a warning, never a block |
| Q5 Critical path, signed lag and automatic rescheduling | Resolved as recommended | Out of scope here. BP-06 J2 lists signed lag; it needs its own decision |
| Q6 Whether holidays are ever imported | Resolved as recommended | No. They are entered by hand, as built |
| Q7 Whether "Ask owners to review" is ticked by default | Resolved as recommended | Yes. The owner can untick it, and nothing is sent outside PPO |
| Q8 What the customer-update draft carries | Resolved as recommended | Milestone dates in calendar days and the reasons in plain words; never working-day counts or internal owner names. The coordinator edits the draft before it is prepared |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | Saved, 19 October 2026 | "Baseline, forecast and dependency review — accepted", saved by Claude in the Figma desktop app on Dean's "Yes, save the named Figma version "Baseline, forecast and dependency review — accepted" and mark the PR ready." and checked at the top of the version history |
| Building the page | Not decided | Section 7 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Baseline, forecast and dependency review — accepted". The file's link is not recorded in this public repository (ADR-0050, [ADR-0053](ADR-0053-figma-page-design.md)) |
| Page | "Baseline, forecast and dependency review · PJ-03" `1743:5636`, under "— Projects —", after the Project record page. The page header `1743:5637` holds the conformance declaration; the notes card `1768:1994` is in Flows and notes. File index row "Row / Baseline, forecast and dependency review · PJ-03" `1788:464416`, after the Project record page row |
| Desktop 1440 | Schedule with baseline r1 shown `1743:5678`; Display menu `1748:259`; task panel, forecast change with a dependency check and successors to review `1749:3306`; task panel, record actual dates `1750:567`; Baselines in working days `1753:731` and full length `1774:2072`; Working calendar drawer `1756:1067`; the drawer changing the calendar to r2 `1757:1302`; Programme `1758:1467` |
| Tablet 1024 | Schedule with baseline r1 shown, rail and project details collapsed `1758:456751` |
| Phone 390 and 320 | Schedule list against baseline r1 `1760:1905`; record actual dates sheet `1763:1865`; Baselines `1763:1765`; Working calendar `1763:2079`; Schedule list at 320 `1763:2237` |
| States | Section `1743:5675`, thirteen cards S1–S13 |
| Parts | In Page components (proposed): Gantt / Baseline bar `1744:256`, Gantt / Baseline milestone `1744:257` and Calendar / Day `1753:456196` (Working, Weekend, Nonworking exception, Working exception, Today, Empty). They stay on the page until a second page reuses them. The phone frames use Shell / Phone header · compact `1530:110` |
| Prototype | Flows "PJ-03 — desktop" and "PJ-03 — phone" |
| Story | Synthetic, as at Mon 12 Oct 2026, schedule version 31, signed in as the coordinator Morgan Lee. SYN-PPO-PRJ-000027 Block C fertigation upgrade (SYN Northbank Nursery, SYN Northbank Block C, Australia/Brisbane), the accepted Project record sample. Baseline r1 "Customer-agreed programme" was recorded on 18 Sep with PPO-PJ-CALENDAR-01. Block C site calendar r1 was recorded on Mon 28 Sep with three dated exceptions: Mon 5 Oct King's Birthday (nonworking), Fri 23 Oct site closed (nonworking) and Sat 7 Nov zone tie-ins (working). Forecast finish Wed 25 Nov against baseline Thu 19 Nov: +6 calendar days, +4 working days. The Programme lists the seven active projects of the accepted Projects register |
| Retained captures | [Baseline, forecast and dependency review design r01](../reference/ui/projects/baseline-forecast-design-r01/README.md): sixteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PJ-03`, the existing routes `/projects/[id]` (Schedule and Baselines views, task panel, working-calendar drawer) and `/projects/programme`; no new route. Parent requirements PRJ-02, PRJ-04 and PRJ-07, unchanged. Capabilities unchanged: `project.read`, `project.edit`, and the current coordinator for baselines and the calendar |
| Page type (r20) | Planning workspace (Schedule); review and comparison (Baselines, Programme); confirmation dialog (Record baseline, as accepted on the Project record page); side panels from the right (the task panel for forecast and actual dates, and the Working calendar drawer for viewing and changing the calendar); on the phone, one record page with view tabs, sheets and pages |
| Reused components | The accepted Project record page (Record / Header, Key dates strip, Details column, View tabs, Gantt rows and bars), the top bar with the Conversations action, Shell / Phone header · compact, Button, Tag, Record / Banner and Record / View tab. New: Gantt / Baseline bar, Gantt / Baseline milestone and Calendar / Day |
| Incoming handovers | The current schedule, its tasks, links and history; immutable baseline revisions with their calendar; the project's working-calendar revisions; actual-date statements; forecasts withdrawn through a received material change (ES-07, SC-09) |
| Outgoing handovers | Record baseline gives one immutable revision and receipt. Save forecast is the existing reasoned task save; when ticked, it also adds one My Work activity for each other successor owner (D10). Record actual dates gives one actual-date revision. Change working calendar gives one calendar revision. Draft a customer update gives a PJ-08 draft and sends nothing (D11). Nothing goes to Service bookings, stock reservations, commercial approval or customer acceptance |
| Source authority | The PJ-03 and Programme design register pages and `guide.pj.03`; the baseline and calendar decisions; the material-change receiving records; the built Projects code listed above |
| Proposed departures | D1–D11 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Baseline, forecast and dependency review — accepted", saved 19 October 2026 |

## 4. What the design shows

- **Schedule.** The accepted Gantt with the selected baseline drawn under each bar, a dashed diamond where a milestone moved, and "+nd" beside each task that finishes later than the baseline. Nonworking days are shaded from the saved calendar, including its dated exceptions. Forecast dates on a nonworking day are underlined in the warning colour and counted in the summary bar's schedule issues. "Calendar r1" in the summary bar opens the working calendar.
- **Task panel.** Opens from a task row, with Details, Actual dates and Links tabs. Details changes the forecast with a reason. It shows the dependency check inline (for example, a finish-to-start successor that would start too early), the change against the baseline in calendar and working days, and the successors to review with their owners. "Ask 3 owners to review" is ticked by default. Actual dates records an actual start, and later a finish, with its own reason and save. It never changes status, progress, the forecast or a booking.
- **Baselines.** Compare with any baseline revision and count in calendar days or working days. Each count names its calendar. Summary tiles, then the changed tasks with baseline, current, start and finish variance, and under each task the latest reason it moved, with date and author. "Draft a customer update" hands the comparison to PJ-08. The revisions list follows.
- **Working calendar.** A full-height drawer from the right, below the top bar. It shows the revision, its reason, the working week, two months with weekends and dated exceptions marked, the exceptions with reasons, and a note that holidays are entered by hand. Change working calendar is the same drawer in edit mode. It has the calendar name, the site time zone (read only), the working week, exceptions with an add row, a preview of what changes (new warnings and working-day counts), a reason and an acknowledgement, and it saves r2 while r1 stays unchanged.
- **Programme.** Each active project against its latest baseline in calendar days. It shows a tag (On baseline, +6 days, −2 days, No baseline yet, undated tasks), the forecast finish, and a timeline with the forecast span, the baseline span, the target and today. The header is one row of months with the Today pill below it. The year is given by the visible range in the summary bar and a stronger divider at 1 January.
- **Phone.** The Schedule list under the compact header, with compare chips that scroll sideways and a baseline line on moved tasks. Actual dates open as a sheet; Baselines and Working calendar open as pages.
- **States.** Loading; no baseline yet; can't record with undated tasks; forecasts withdrawn by a material change; newer saved version; calendar changed since the baseline; view only; editor who isn't the coordinator; closed project; save not confirmed; access removed; status and actual dates disagree; date after today refused.

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | Baseline bars as a Display option: a thin grey bar under each task and a dashed diamond where a milestone moved, with a legend entry. Settles Q1 left open on the Project record page | No baseline on the Gantt |
| D2 | Variance in calendar days or working days. Each count names its calendar. The key dates strip stays in calendar days | Calendar days only |
| D3 | Working calendar: opened from "Calendar r1" in the Schedule summary bar. On desktop it is a full-height drawer from the right, 680 px, below the top bar, like the task panel. On the phone it is a page. View and change are two modes of one drawer, and only the coordinator can change it, after a preview of what changes | API only |
| D4 | The task panel gains tabs (Details, Actual dates, Links). Actual dates have their own reason and save | API only |
| D5 | A forecast change shows its dependency check inline, and lists the successors to review, direct and through other tasks, with their owners. Nothing moves | Successors to review exist; no inline check |
| D6 | Nonworking shading follows the saved calendar, including dated exceptions. A forecast date on a nonworking day is underlined in the warning colour and counted as a schedule issue | Saturday and Sunday only |
| D7 | Programme compares each active project with its latest baseline in calendar days, with forecast and baseline spans, the target and today. Revisions and working days stay on the project page; there is no portfolio-wide baseline | The Gantt per project |
| D8 | Phone: the compact record header; compare chips scroll sideways; Baselines and Working calendar open as pages; actual dates open as a sheet with a full-width 48 px action | None |
| D9 | Why it moved: the latest forecast reason, with date and author, under each changed task on Baselines, from the schedule history already kept; "+nd" beside moved tasks on the Gantt | Not shown |
| D10 | Ask owners to review: when a forecast change has successors owned by others, ticking the option (on by default) adds one My Work activity per owner, linking to their task. Dates do not move | None |
| D11 | Draft a customer update: Baselines hands the comparison (milestones, calendar-day changes and reasons) to PJ-08 as a draft for the coordinator. Nothing is sent | None |

## 5. Audit and polish

- **Layout.** At Dean's request, the page was re-laid out to the Template. The header comes first; sections sit 80 px apart with 60 px padding; frames are in rows, each with a wrapped label above it; state cards are in rows of three at equal height. A programmatic check found no overlaps, and nothing sits outside its section.
- **Calendar drawer.** The two calendar dialogs, about 875 px tall, became one right-hand drawer with a fixed header and footer and a scrolling body (D3).
- **Programme header.** It was rebuilt twice. The final version is one row of plain month names, left-aligned to their start lines as on the Schedule Gantt, with the Today pill below them on the purple line. The line starts at the bottom of the pill. The year is given by the range in the summary bar and a stronger divider at 1 January. Grid lines carry through the selected row.
- **Audit of all frames.** An automated check found no clipped text and no text left over from the pages copied. Gaps were closed with D9 to D11, a full-length Baselines frame, and edge fades on the phone compare chips.

The audits are recorded on the notes card `1768:1994`.

## 6. Verification

- Claude checked the frames with screenshots taken inside Figma, and swept every frame for clipped text and for text left from the copied pages.
- At Dean's request, Claude played both flows in Present mode in Dean's Figma desktop app.
  - Desktop: Display open and close; Calendar r1, the drawer, Change calendar, Save calendar r2 and Close; a task row into the forecast panel and Actual dates; the panel tabs, Save and Cancel; the Baselines and Schedule tabs; the rail's Programme item into the Programme; and the Block C row back.
  - Phone: the Baseline r1 and Calendar r1 chips and back; a task row into the Actual dates sheet; and close.
  - Every link worked. Two problems were fixed during the play: the rail's Programme item had no link, and the content areas did not scroll. Scrolling was checked by dragging.
- The sixteen captures are copies of the accepted frames on the "Captures (icon-free)" page at y = 320,000 (`1788:215750` to `1788:220578`). Prototype links were removed and each of the 393 Font Awesome icon instances was swapped for `Icon/placeholder`, keeping its colour. No Font Awesome instance is left. The copies brought no flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/projects/baseline-forecast-design-r01/README.md).
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 7. Not decided and not drawn

- **Building the page.** The build order is not decided. Much of the back end exists: baselines (0081), calendars and actual dates (0088), and successors to review. A build would add:
  - the Display option and baseline bars on `ProjectsGantt`;
  - the working-day count on `ProjectBaselines`;
  - Actual dates and the inline dependency check in `ProjectTaskPanel`;
  - the Working calendar drawer over the existing calendar API;
  - the Programme comparison.
- **New data or handovers that need their own decisions:**
  - the latest reason per changed task as a read (D9); the reasons are already stored with each save;
  - My Work activities from a forecast change (D10);
  - the PJ-08 draft handover (D11), which waits for PJ-08's own prerequisites.
- **Not drawn:**
  - comparing two baselines (r2 against r1) and paging older revisions;
  - withdrawing an actual-date statement;
  - the Links tab;
  - tablet versions of the panel and drawer;
  - the phone Change calendar form;
  - 200% zoom and keyboard order.
- **Follow-up:** give the Project record's Schedule Gantt month row the same treatment as the Programme header when that page next changes.
- **Found while drawing:** on the Components page, the "Shell / Phone header · compact" variants named Width=390 are 320 px wide. The new phone frames resize their instances to 390; the component itself is unchanged.
- **Data in the frames:** the people, organisations, projects, sites and dates are synthetic. The Queensland King's Birthday exception is a synthetic calendar entry, not a verified operational calendar.
