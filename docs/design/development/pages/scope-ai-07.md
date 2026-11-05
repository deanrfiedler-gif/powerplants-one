# Recurring checks and automation review — design reference

Stable entry: `scope:AI-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant/automations`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement recurring-check/automation review, schedules, run history and controlled follow-up.

1. Define the observation and meaningful-change condition
2. Review permitted actions and notification recipients
3. Inspect run outcomes and disable obsolete schedules

## Desktop

Accepted design: the [Recurring checks design decision](../../../decisions/recurring-checks-figma-design.md) of 1 November 2026 covers the checks list, template library, new check with preview, run history, run detail, partial run and paused by budget, with nineteen icon-free captures in [design r01](../../../reference/ui/my-work/recurring-checks-design-r01/README.md). Reviewed templates only; a run suggests and never acts. The list opens from the My Work side menu (D1). Tablet 1024 is the checks list with the rail and side menu collapsed.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 09–12 in [design r01](../../../reference/ui/my-work/recurring-checks-design-r01/README.md): the My Work suggestion card and the run detail, at 390 and 320. Creating and editing checks is for desktop and tablet in the pilot (D12).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Recurring checks design r01](../../../reference/ui/my-work/recurring-checks-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Recurring checks design r01 captures](../../../reference/ui/my-work/recurring-checks-design-r01/README.md) (nineteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/recurring-checks-figma-design.md). Main frames show runs as if PPO checks were scheduled; no scheduler exists, and scheduling is not decided. The approver's screen, a check's Settings and Changes tabs and 200% zoom are not drawn; building the page is not decided.

The draft User Guide `guide.ai.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
