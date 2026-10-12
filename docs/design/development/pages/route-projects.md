# Project register — design reference

Stable entry: `route:/projects`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Select the project and check its reporting basis
2. Review overdue milestones and explained health
3. Open the underlying issue before assigning recovery work

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

- [projects-register-desktop.png](../../../blueprints/projects-visuals/projects-register-desktop.png)
- [ppo-projects-gantt-content-r10.html](../../../reference/ui/projects/ppo-projects-gantt-content-r10.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.projects` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## PJ-01/PJ-02 backend continuation — 13 October 2026

The [backend contract](../../../decisions/project-overview-backend.md) joins exact native Sales receiving attribution, saved dates/baselines, phase counts, team, scoped RAID/actions and explained portfolio attention. Existing page types, shared Button/Field/dialog/Gantt controls, routes and scope IDs stay in place. Incoming handovers remain explicit accepted Sales events; outgoing actions remain native schedule, baseline, Activity, RAID and acceptance workflows. No new component or page is implemented here.

Desktop and phone consumers must show the selected versus latest baseline, site timezone, unknown forecast when tasks are undated, historical versus current Sales evidence, named receiving owner, restricted coverage and preview continuation. Counts describe all authorised matches for the displayed filters; page tokens are transient. No current flags is not a health score or completion approval. Keep missing/stale/loading/denied and uncertain native-save states accessible through the existing controls.

The [accepted Project record design](../../../decisions/project-record-page-design.md) and its exact icon-free captures remain the reference for the later page. Exact new API-state desktop/phone captures are missing. [Backend evidence](../../../testing/evidence/project-overview/README.md) does not grant visual, device, guide or owner acceptance. Review fingerprints stay unchanged.
