# Sales Tasks — design reference

Stable entry: `route:/sales/tasks`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/tasks`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Your active tasks linked to leads and deals: activities of type Task, the same records as My Work. Complete or reschedule the original action. Source presence does not establish deployment or full-scope acceptance.

1. Review your active tasks linked to leads and deals
2. Work through Lead tasks and Deal tasks, starting with anything overdue
3. Open the activity and record an outcome when completing it

## Desktop

Accepted design: the [Sales Pulse and Tasks design decision](../../../decisions/sales-pulse-tasks-figma-design.md) of 1 November 2026 covers one grid grouped by due, with a side menu for due views and linked type; Owner and Linked filters; a Filters panel; Reschedule, Set a date and their failures; Owner: Everyone with view-only rows; and Next page beyond 25 tasks. The built page is not yet changed to this design.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 24, 25 and 27 in [design r01](../../../reference/ui/crm/sales-pulse-tasks-design-r01/README.md): the My Work phone list, Choose view, a full-screen filter panel, the Reschedule sheet, and one search and filter screen at 320.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Sales Pulse and Tasks design r01](../../../reference/ui/crm/sales-pulse-tasks-design-r01/README.md) (thirty icon-free PNGs; design compositions, not application captures).

- [PPO-My-Work-and-Action-Centre-r01.html](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.sales.tasks` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** Pagination buttons show with no tasks. The sub-tabs offer Deals and Leads but not Tasks, so no tab is active. S6: the zone name appears in each count line.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
