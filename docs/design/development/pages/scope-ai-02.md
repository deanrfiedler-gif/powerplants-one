# AI proposal review and saved outcomes — design reference

Stable entry: `scope:AI-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant/proposals`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement AI proposal review, changed-source comparison and saved outcomes through ordinary domain commands.

1. Compare the proposal with its source context
2. Resolve changed or missing information
3. Apply only through the domain's validated command

## Desktop

Accepted design: the [proposal review design decision](../../../decisions/assistant-proposal-review-figma-design.md) of 31 October 2026 covers the review form inside the AI-01 panel with provenance on every field, Ready, the not-saveable value, the changed-since-prepared comparison, Saving, Saved, Outcome unknown, Expired and Your proposals, with the full-width surface at 1024 and sixteen icon-free captures in [design r01](../../../reference/ui/my-work/assistant-proposal-review-design-r01/README.md). D1–D19, answers Q1–Q7 and the accepted polish are recorded there. Proposed additions F1–F3 are drawn but not accepted. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 12 and 13 in [design r01](../../../reference/ui/my-work/assistant-proposal-review-design-r01/README.md): the review form full screen, Saved and Outcome unknown at 390 and 320, and not saveable, changed since prepared and Your proposals at 390, with 16 px inputs, 48 px controls and full-width bottom actions.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Proposal review design r01](../../../reference/ui/my-work/assistant-proposal-review-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Proposal review design r01 captures](../../../reference/ui/my-work/assistant-proposal-review-design-r01/README.md) (sixteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/assistant-proposal-review-figma-design.md). A phone Ready frame, Your proposals at 1024, keyboard focus order and 200% zoom are not drawn. Building it is not decided.

The draft User Guide `guide.ai.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
