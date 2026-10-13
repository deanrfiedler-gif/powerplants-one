# Programme — design reference

Stable entry: `route:/projects/programme`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/programme`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Distinguish the saved baseline from the current forecast
2. Inspect dependency and calendar assumptions
3. Record justified changes while retaining the previous basis

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [ppo-projects-gantt-content-r10.html](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.projects.programme` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
## Project baseline access

After selecting a project, the programme's ProjectsGantt host offers the same PJ-03 Baselines and forecast dialog as project detail. Reuse the current Planning workspace and Review/comparison controls; incoming project schedule/history and outgoing baseline or task receipts retain their owners. It compares one selected project; portfolio-wide baselines remain outside this increment.

Desktop retains the fixed schedule; phone uses the same wrapping single-column dialog, labelled controls and focus return. No exact programme/baseline image is supplied. Keep r10 as the surrounding reference and paired review pending. See [PJ-03](scope-pj-03.md) and [verification](../../../testing/evidence/project-baselines/README.md).


## PJ-03 working calendar and actual-date backend

The existing Gantt, task editor and baseline dialog use saved Project calendars for advisory dependency checks. Name the current calendar and revision; preserve calendar-day geometry and the explicitly labelled calendar-day comparison. Weekend shading still marks Saturday/Sunday rather than business availability. The `saved-calendar` catalogue state uses a synthetic 23 September closure. New baselines retain their exact calendar revision; actual-date evidence remains separate from task status/progress.

Incoming: scoped programme/calendar/actual revisions. Outgoing: native task saves and immutable baseline receipts; calendar/actual commands are currently API-only. Reuse ProjectsGantt, ProjectTaskPanel, ProjectBaselines and their existing controls. Existing consumer bindings and r10 reference remain. No exact image for calendar editing or actual-date controls exists; these surfaces and paired acceptance remain open. Desktop and phone must retain scroll, keyboard access, calendar labels and advisory warnings without adding a sibling panel. Functional evidence: `docs/testing/evidence/project-programme/README.md`; source presence is not deployment or visual acceptance.

Change history distinguishes calendar, actual-date, task and acceptance events; it must not label every Project version as a task save. Desktop/phone native-host proof covers those labels.
