# Page guides and contextual help coverage — design reference

Stable entry: `scope:DK-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/help`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend existing shell page guides with task-complete guidance and coverage for every delivered workspace.

1. Open User guide for the selected register entry
2. Use contents or guide search to find the task
3. Review applicability and follow related guidance before acting

## Desktop

The accepted design governs the guide panel (600 px, non-modal overlay), the Help Centre home, search, journey, reading view, development draft section, no guide, coverage, gaps and guide review. The notes below stay as common rules where the design says nothing.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

The accepted design opens Page guide from the phone menu (P4) into a full-screen reader using the compact record header, with contents, a task with its SOP, and search, at 390 and 320 px, with 16 px inputs and 44 px targets. Tablet 1024 uses the panel as an overlay.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The phone design is accepted as a design only. Retain evidence from the running application here when it exists; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Owner-accepted Figma design, 1 November 2026: [the design decision](../../../decisions/help-centre-figma-design.md) (PPO-DK07-HELP-CENTRE-FIGMA-DEC), with [nineteen retained captures](../../../reference/ui/help-centre/help-centre-design-r01/README.md). They are icon-free design compositions, not application captures, and set no UI baseline. The print layout is not drawn. The named Figma version is "Help Centre & page guides — accepted", saved by Dean on 1 November 2026.

## Behaviour, handovers and verification

The draft User Guide `guide.dk.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
