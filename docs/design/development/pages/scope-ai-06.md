# AI assistance settings and quality review — design reference

Stable entry: `scope:AI-06`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant/settings`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement assistant settings, provider state, permitted capability/source controls and quality review.

1. Review configured capability boundaries
2. Inspect failure and quality evidence
3. Apply settings through the authorised administration process

## Desktop

Accepted design: the [Assistant settings design decision](../../../decisions/assistant-settings-figma-design.md) of 30 October 2026 covers the overview, Provider and budget with the five pre-call checks, the second-person Switch provider dialog, the budget-used-up state, Capabilities and sources with its change panel, Data handling, the evaluation runs, a synthetic example run, the Flagged answers worklist and the flagged answer record, with sixteen icon-free captures in [design r01](../../../reference/ui/settings/assistant-settings-design-r01/README.md). Departures D1–D8 and answers Q1–Q6 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 12–16 in [design r01](../../../reference/ui/settings/assistant-settings-design-r01/README.md): the overview and the flagged answer at 390 and 320, and seven phone states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Assistant settings design r01](../../../reference/ui/settings/assistant-settings-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Assistant settings design r01 captures](../../../reference/ui/settings/assistant-settings-design-r01/README.md) (sixteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/assistant-settings-figma-design.md). Approving a switch, switching back to Simulated, saved capability and feature-flag changes, an evaluation in progress, a closed flagged answer and the Correct and Unsafe outcomes, Carl-specific thread settings and 200% zoom are not drawn. Building it is not decided.

The draft User Guide `guide.ai.06` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
