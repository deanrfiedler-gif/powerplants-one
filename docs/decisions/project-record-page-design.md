---
document_id: PPO-PJ-RECORD-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; record-read, history-read and proposed-data additions, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 4228d470ca4c566a15e7c3397fc053b8f7bef4bc
versioning: git
---

# Project record page design — owner decision

On 12 October 2026 Dean asked: "I now want you to build the UI page in Figma for an individual project record." He opened his Wrike free trial for reference and asked Claude to check that "our projects record page includes all the required information that is generally required on a project record page". Claude did two things:
- It reviewed the trial's project record.
- It read what PPO's project record holds today in code and decisions.

Claude then drew the page on the shared record layout from the lead and work order record pages.

Before deciding, Dean asked twice whether Claude was satisfied:
- **First answer:** Claude named concrete flaws, including the Gantt colours. Dean replied "Yes, go ahead with this polish pass".
- **The Gantt colours:** Dean then said "I like the pastel green, and the pastel orange, but I don't like the dark navy colour ... I still like to use pastel colours where possible", and the bars were redrawn.
- **Second answer:** Claude fixed two further flaws it found on another look.

Dean accepted the design: "Proceed with your recommendations". The design reference is the named Figma version "Project record page — shared record layout, accepted".

This record retains:
- his decisions;
- the Wrike observation and what it changed;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules and the departures from today's page;
- what remains open.

Scope:
- **Route:** the existing route `/projects/[id]`, register entry `route:/projects/[id]` ("Project detail & Gantt").
- **Scopes:**
  - `PJ-02` "Project overview and portfolio health";
  - `PJ-03` "Baseline, forecast and dependency review";
  - a read-only summary of `PJ-09` "Staged acceptance and closeout".
- **Parent requirements:** PRJ-01, PRJ-02, PRJ-06 and PRJ-08.
- No parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code or new reads;
- new data such as project notes, document links or a MYOB read;
- a route change or migration;
- a permission or capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the project record page | User decision, 12 October 2026 | "I now want you to build the UI page in Figma for an individual project record." Dean asked for the page to be checked against his Wrike trial and allowed Claude to click through it and add data |
| Check against Wrike | Bounded account observation, 12 October 2026 | Section 2. Wrike is a reference for completeness, not a requirement, a pattern to copy or an authority |
| Polish pass | User decision, 12 October 2026 | Dean asked whether the pages "could be improved and made more professional" and whether Claude was happy with the bar colours. Claude listed the flaws it saw; Dean replied "Yes, go ahead with this polish pass" |
| Pastel Gantt bars, no dark navy | User decision, 12 October 2026 | "I like the pastel green, and the pastel orange, but I don't like the dark navy colour. You can use additional colours for this bars if needed. I still like to use pastel colours where possible." |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Proceed with your recommendations". Every recommendation (R1–R9 below) is adopted, and each open question takes its recommended answer (Q1–Q5 below) |
| R1 The shared record layout | Claude's recommendation, adopted | The one-row header, the 380 px details column that scrolls on its own and the main column with view tabs, as on the lead and work order record pages. The readiness bar is replaced on project records only (R3) |
| R2 Six views | Claude's recommendation, adopted | Overview (default), Schedule, Baselines, Acceptance, Files and History |
| R3 Key dates strip | Claude's recommendation, adopted | Start, today, baseline finish, forecast finish and target handover, with "+n days against baseline" and "n days before target". It replaces the checks bar, because a project has no gate to be "ready" for. Problems stay in Needs attention; there is still no health score |
| R4 The Gantt stays | Claude's recommendation, adopted | Schedule keeps today's Gantt and toolbar. The details column folds to a 44 px labelled strip, so the chart gets the full width |
| R5 Header actions | Claude's recommendation, adopted | Record baseline (the current coordinator only) and Add task (Project edit). "…" holds Sales handovers, Record a customer need for Sales, Open Acceptance & closeout and Copy link |
| R6 Overview leads with Needs attention | Claude's recommendation, adopted | Overdue milestones, at-risk tasks and successors to review. Then milestones against baseline, progress by phase, baseline and acceptance summaries, and recent history |
| R7 Project team from task owners | Claude's recommendation, adopted | The coordinator and every task owner, with external owners (customer contacts) marked. Assigning an owner still sends no message |
| R8 Acceptance as a summary | Claude's recommendation, adopted | A read-only summary with the close-out path, linking to the acceptance workspace. This page never closes or reopens a project |
| R9 Phone | Claude's recommendation, adopted | Details, Overview, Schedule (a list, because the Gantt is off below 780 px) and History tabs. Baselines, Acceptance and Files open from Details. The footer keeps "…", Record baseline and Add task |
| Q1 Baseline bars on the Gantt | Resolved by "Proceed" | Yes, as a later Display option; not in this design |
| Q2 An "On hold" state like Wrike's | Resolved by "Proceed" | No. Lifecycle stays Active and Closed; at-risk tasks and notes cover a paused project |
| Q3 Commercial section | Resolved by "Proceed" | Build it only once a read-only MYOB read exists; hide it until then. The design keeps a one-line placeholder |
| Q4 Overdue rule | Resolved by "Proceed" | Not complete and dated before today in the site's timezone, as in the accepted Projects register |
| Q5 Default tab | Resolved by "Proceed" | Overview; Schedule while a project has no tasks |
| Building the page, the reads and the shell | Not decided | Section 7 |

## 2. Wrike observation

On 12 October 2026 Claude looked at Dean's Wrike free trial through Claude in Chrome:
- the "Demo" project's info panel and field list, and its actions menu;
- its Table, Board, Gantt chart, Files, Analytics, Calendar and Stream views;
- one task record;
- the Projects dashboard.

Claude added only a Stream view to the Demo project. This is a bounded observation of a third-party trial account, not of Powerplants' operations.

| What Wrike's project record carries | Where it is on this page |
|---|---|
| Status (New, In progress, Completed, On hold, Cancelled) | Lifecycle (Active or Closed) in the header and Summary; Needs attention for problems. On hold and Cancelled are left out (Q2) |
| Assignee and followers | Coordinator, plus Project team derived from task owners |
| Start and due dates | Key dates strip: start, forecast finish, baseline finish and target handover |
| Description | Title and origin (won deal and Sales handover). PPO has no free-text scope field, and the project's context is fixed at creation |
| Subitems, dependencies and the Gantt chart | Schedule tab, unchanged |
| Progress | Tasks complete by phase, as counts. No overall percentage |
| Author, created date and ID | Meta line and Summary |
| Files | Files tab: SharePoint links (proposed) and acceptance handover packs |
| Approvals | Acceptance tab: the close-out path |
| Comments and Stream | History tab, with a proposed note composer |
| Analytics (all, active, overdue, progress) | Needs attention, Milestones and Progress by phase |
| Budget and financial settings | Commercial: a proposed read-only MYOB summary, hidden until that read exists (Q3) |
| Custom fields, whiteboards, booked effort and time spent, billable rates, duplicate and blueprints, follow and update-by-email, AI agents and Copilot | Left out. Field timers have no project link, and the rest are not PPO decisions |

## 3. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO — Design" in Dean's Figma team, at the named version "Project record page — shared record layout, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Project record page (accepted)" `345:2`, sample SYN-PPO-PRJ-000027 "Block C fertigation upgrade": <ul><li>Overview `345:5185`;</li><li>Schedule `348:516`;</li><li>Baselines `349:674`;</li><li>Acceptance, not started `351:994`;</li><li>Files `351:1601`;</li><li>History `352:1663`;</li><li>Record baseline dialog `368:3579`;</li><li>the register entry `355:70824`, whose snapshot gains "Open project page";</li><li>the states section `358:5184`;</li><li>phone list `355:71007`, Details `354:5184`, Overview `355:2281`, Schedule list `355:2665` and the action sheet `362:3714`.</li></ul>Its notes card `363:5184` lists the scope, the Wrike check, the rules, recommendations, departures, polish changes, what is not drawn and the prototype |
| Components | <ul><li>Page components: Project record / Details column `346:5184`, used by every desktop view and the phone Details; Project record / Key dates strip `364:3919`; Project record / Key dates card (phone) `364:3943`.</li><li>Reused unchanged: Record / Header, View tab, Field, Section heading, History item, Filter chip and Banner from the lead and work order record pages, and Work order record / Blocker row for the attention rows (proposed to become a shared Record / Attention row).</li></ul> |
| Proposal colours | Nine `proposal/gantt-*` variables in "PPO colour" for the pastel Gantt (section 5). The adopted colour tokens are unchanged |
| Prototype | Flows "Project record — desktop" from the register entry and "Project record — phone" from the phone list. Tabs switch views, the breadcrumb returns to the register, Record baseline opens the dialog, Add task opens Schedule, the Overview links open their tabs and "…" opens the record menu |
| Retained captures | [Project record page design r01](../reference/ui/projects/project-record-page-design-r01/README.md): ten icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 4. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing route `/projects/[id]` (`src/app/(business)/projects/[id]/page.tsx`, which renders `ProjectSchedulePage` in `src/components/projects-screens.tsx` around `ProjectsGantt`), register entry `route:/projects/[id]`, scopes `scope:PJ-02` and `scope:PJ-03` with a `scope:PJ-09` summary, requirements PRJ-01, PRJ-02, PRJ-06 and PRJ-08. Capabilities, unchanged: `project.read` to see the project, `project.edit` to change tasks, the current coordinator to record a baseline, and the `acceptance.*` capabilities in the acceptance workspace |
| Page type (r20) | Record detail. The Schedule tab is a Planning workspace, as today. The Baselines tab is a Review / comparison view, and recording a baseline is a confirmation dialog. On the phone: one record page with tabs. The task panel, the Sales handovers dialog and the acceptance workspace keep their current types and are not redesigned here |
| Reused components | <ul><li>The accepted Projects rail and shell from the Projects register design (accepted 11 October 2026; its decision record is still to be written).</li><li>The shared record parts from the [lead record page decision](lead-record-page-design.md) and the work order record page decision (`docs/decisions/work-order-record-page-design.md`, in review as pull request 432).</li><li>Button, Tag and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New: the components in section 3.</li></ul> |
| Source authority | <ul><li>`src/projects/model.ts`, `validation.ts` and `service.ts`, and migration `0019`: the project and task fields; context fixed at creation; phases, statuses and milestone rules; FS/SS dependencies that warn but never move dates; a reason for every save.</li><li>[Project schedule baselines](project-schedule-baselines.md), `src/projects/baselines.ts` and `baseline-model.ts` (migration `0081`): who records, what a snapshot holds, PPO-PJ-CALENDAR-01 and calendar-day variance.</li><li>[Projects Gantt integration](projects-gantt-integration.md) and [ADR-0033](ADR-0033-staged-acceptance.md) with `src/projects/acceptance/policy.ts`: closing and reopening.</li><li>[Won delivery continuity](won-delivery-continuity.md) (migration `0076`) for the won-deal origin.</li><li>Sites carry an address and a primary contact (migration `0002`).</li></ul>Fixture: synthetic `SYN-PPO-PRJ`, `SYN-PPO-OPP`, `SYN-PPO-ENG` and `SYN-PPO-WO` references, customers, sites, people and dates; today is Monday 12 October 2026 |
| Incoming handover | The Projects register (a row, or "Open project page" in the snapshot), the phone list, won-deal receiving, Customer 360, a contact's tasks and global search |
| Outgoing handover | Acceptance & closeout, Sales handovers, "Record a customer need for Sales review", the customer, site and contact records, the engineering package and work orders matched by project reference. Planned dates never override confirmed bookings; Service rescheduling stays separate |
| States shown | <ul><li>An active project with an overdue milestone and two at-risk tasks, in every view.</li><li>The Record baseline dialog.</li><li>Six states: closed; a read-only viewer; a schedule not ready for a baseline; an editor who is not the coordinator; a dependency warning; a newer saved version while editing.</li><li>The phone list, three tabs and the action sheet.</li></ul>Loading, denied and phone states other than these are not drawn |
| Departures | Section 6 |
| Verification | Section 9 |

## 5. Display rules

### Key dates

| Item | Rule |
|---|---|
| Start | The earliest task start |
| Today | Today in the site's timezone |
| Forecast finish | The latest task finish |
| Baseline finish | The latest finish in the selected baseline (the latest revision by default) |
| Target | The target date fixed at creation, or "not set" |
| "+n days against baseline rN" | Forecast finish minus baseline finish, in calendar days |
| "n days before target" | Target minus forecast finish, in calendar days |

When some tasks are undated, the strip says how many and draws no timeline (state P3). A closed project shows its finish and closing dates (state P1).

### Needs attention

Each row is something the code already records:
- an overdue milestone (Q4);
- a task in At risk, with its latest reason;
- the successors of those tasks, for their owners to review.

Nothing here moves a date.

### Gantt bars (pastel)

Every bar is pastel, with a darker outline of the same colour, so status shows in the fill as well as the outline. Every outline is at least 3:1 against white.

| Status | Bar |
|---|---|
| Complete | Pastel green (`status/success/surface`) with a green outline |
| In progress | Pastel blue (`proposal/gantt-blue-fill`); the done part is deeper blue (`proposal/gantt-blue-progress`); blue outline (`proposal/gantt-blue-outline`) |
| At risk | Pastel orange (`status/warning/surface`); the done part is deeper orange (`proposal/gantt-orange-progress`); brown outline; a warning marker after the bar |
| Planned | Pale grey (`surface/subtle`) with a grey outline (`border/control`) |
| Milestone | A diamond: filled green when complete; filled red (`proposal/gantt-red-progress`) with an exclamation marker when overdue; hollow grey when planned |
| Phase | A soft grey bracket over the phase's tasks |
| Today | A violet line and label (`proposal/gantt-today`, `-today-surface`, `-today-text`); red only ever means overdue |
| Target | A dashed grey line with a flag |

There are no owner names beside the bars, because the Owner column has them. Weekend columns are shaded, because PPO-PJ-CALENDAR-01 is Monday to Friday. A legend sits in the summary bar.

### Header actions

| Viewer | Actions |
|---|---|
| The current coordinator of an Active project | Record baseline and Add task |
| Someone with Project edit who is not the coordinator | Add task only (state P4) |
| Someone with Project read only | None; "…" keeps Copy link (state P2) |
| Anyone, on a Closed project | Open Acceptance & closeout; nothing in the schedule can change (state P1) |

## 6. Departures from today's page

| ID | Departure | Today |
|---|---|---|
| D1 | The accepted Projects shell and the shared record layout, with view tabs | The Gantt alone, with dialogs for change history, baselines and Sales handovers |
| D2 | The header shows Lifecycle, the position in the register view, Record baseline and Add task | Reference, title, customer, site, target handover and coordinator; no lifecycle badge |
| D3 | Key dates strip | Not shown |
| D4 | New reads: forecast and baseline finish, phase counts, project team, needs attention, related work (engineering package, work orders matched by project reference, supply demands raised from the project) and the record position | Not shown |
| D5 | History merges schedule events with baseline records and linked activities, grouped by day and filtered with counts | A history dialog of schedule events only |
| D6 | Proposed new data: project notes, SharePoint document links and a read-only MYOB commercial summary | Not held. Project notes exist only per task, and documents only as acceptance handover packs |
| D7 | The pastel Gantt palette, weekend shading, bracket phase bars, a legend and no owner labels beside the bars | Today's Gantt colours |

A fault was found while reading the code. Today's history dialog labels every event except the first "Task saved", including acceptance changes (`src/components/projects-screens.tsx`). It should be fixed when the page is built.

## 7. Not decided

- **Building the page.** The view tabs, the key dates strip, Needs attention, the new reads (D4) and the merged history (D5) need their own decisions and pull requests. Today's read returns the project, its tasks and dependencies, its baselines and its history events, but not the derived figures, the team, related work or the record position.
- **New data (D6).** Project notes, SharePoint document links and a MYOB read each need their own design, ADR where a technology is chosen, and migration. MYOB stays the ERP authority and SharePoint owns documents.
- **Baseline bars on the Gantt (Q1).** A later increment.
- **Rolling out the shell.** As for the registers, the shell parts are decided separately for every page.
- **The Projects register lock-in.** Its design was accepted on 11 October 2026 and its named version is saved, but its decision record and captures are not yet in the repository.
- **Later tabs:** PJ-04 RAID, decisions and actions (PRJ-03); PJ-05 contract obligations and variations (PRJ-05); PJ-06 subcontractor packages; PJ-07 readiness and change impact; PJ-08 stakeholder updates (PRJ-07). Each would add a view tab when built.
- **Not drawn yet:**
  - phone History, Baselines, Acceptance and Files;
  - loading and denied states;
  - the task panel (today's dialog is kept);
  - phones at 320 px.

## 8. Consequences

- No application code, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [project detail register entry](../design/development/pages/route-projects-id.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- The shared record layout now has three record types. A record without a gate may replace the readiness bar with a key dates strip; lead and work order records keep theirs.
- The `proposal/gantt-*` colours stay proposals until the page is built and the shared tokens are reviewed.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 9. Verification

- Claude checked every frame with screenshots taken inside Figma. It reviewed the design twice on Dean's request and fixed what it found:
  - **First review:** contrast, a colour pair that red-green colour blindness cannot separate, repetition, a details column of about 1,600 px, and empty-looking zero tiles.
  - **Second review:** milestone diamonds told apart by colour alone, and states without the key dates strip.
- An audit of the page found no overlapping frames and no prototype link to another page. Links that cloned frames carried to the work order page were removed; the rails' component interactions were kept.
- **Contrast:** bar outlines are at least 3:1 against white (the lowest is the grey planned outline at 3.3:1). Text uses the same token pairs as the earlier record pages. The amber and violet label text sits on white or on its own tint.
- Claude cannot run Present mode through the connector, so the click-through was not exercised by Claude.
- The ten captures are copies of the accepted frames, made on the "Captures (icon-free)" page, with every Font Awesome icon swapped for `Icon/placeholder`: 389 icons in all. A check after the swap found none left. They were exported at scale 1 with the Figma connector, downloaded, and inspected. The hashes are in the [captures README](../reference/ui/projects/project-record-page-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
