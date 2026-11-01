# Sales Pulse — design reference

Stable entry: `route:/sales/pulse`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/pulse`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Your daily Sales attention: lead and deal actions, upcoming work, missing next steps and overdue follow-up. The rows are the same records as My Work; there is no second task store. Source presence does not establish deployment or full-scope acceptance.

1. Review your lead and deal actions, starting with anything overdue
2. Check Deals needing a next step and Deals with overdue follow-up
3. Complete or reschedule the original activity, or open the deal to plan its next step

## Desktop

Accepted design: the [Sales Pulse and Tasks design decision](../../../decisions/sales-pulse-tasks-figma-design.md) of 1 November 2026 covers Pulse with its summary strip, labelled count rules, Lead actions, Deal actions, Calls to log, Deal attention and Upcoming meetings; the activity window; Record outcome and its results; Plan activity; Plan next as a linked follow-up; outside access; leads-only and deals-only people; and the states. The built page is not yet changed to this design.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 23, 24, 26 and 27 in [design r01](../../../reference/ui/crm/sales-pulse-tasks-design-r01/README.md): stacked sections that start collapsed when nothing is overdue or due today, an activity screen, full-screen sheets with 16 px inputs, and phone states at 390 and 320.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Sales Pulse and Tasks design r01](../../../reference/ui/crm/sales-pulse-tasks-design-r01/README.md) (thirty icon-free PNGs; design compositions, not application captures).

- [ppo-deal-pipeline_r38.html](../../../reference/ui/crm/ppo-deal-pipeline_r38.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.sales.pulse` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
