# Cash timing and commercial outlook — design reference

Stable entry: `scope:FN-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/finance/outlook`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement cash timing and commercial outlook with explicit source/time/currency and scenario distinctions.

1. Separate actual receipts/payments from forecast scenarios
2. Review timing assumptions and missing data
3. Record scenario changes with their rationale

## Desktop

Accepted design: the [Cash outlook design decision](../../../decisions/cash-outlook-figma-design.md) of 31 October 2026 covers the outlook overview, all expected lines, by project, week detail, assumptions and gaps, waiting for me, scenario comparison, project outlook, source reads, actuals from MYOB and the side forms New scenario, Change an assumption and Confirm an expected date, with thirty-five icon-free captures in [design r01](../../../reference/ui/finance/cash-outlook-design-r01/README.md). Departures D1–D15 and answers Q1–Q13 are recorded there. Tablet: capture 14, with the rail and side menu collapsed and a six-column week summary.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 15–22 in [design r01](../../../reference/ui/finance/cash-outlook-design-r01/README.md): summary of the next four weeks, week detail, gaps worklist and line detail at 390 and 320, with 16 px inputs and 44 px targets. Phone states aren't drawn.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Mobile-specific evidence is in the captures above; a desktop image is not mobile evidence.

## Shared components and states

Accepted design: captures 23–35 in [design r01](../../../reference/ui/finance/cash-outlook-design-r01/README.md) show loading, no expected items, could not load, no Finance access, MYOB out of date, assumption stale, scenario out of date, customer not mapped, form validation, saving, save not confirmed, date conflict and the project manager view. The shared Button has no disabled variant, so the saving state dims its buttons.

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Cash outlook design r01 captures](../../../reference/ui/finance/cash-outlook-design-r01/README.md) (accepted Figma design, icon-free)

## Behaviour, handovers and verification

The draft User Guide `guide.fn.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
