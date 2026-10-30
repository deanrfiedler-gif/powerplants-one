# Knowledge authoring, review and learning intake — design reference

Stable entry: `scope:DK-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/knowledge/review`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement knowledge authoring, review, publication/withdrawal and learning intake.

1. Prepare content from verified observations
2. Review accuracy and sensitive information
3. Publish a successor or withdraw unsuitable guidance

## Desktop

Accepted design: the [Knowledge authoring design decision](../../../decisions/knowledge-authoring-figma-design.md) of 30 October 2026 covers the worklist, triage from a source record, the article editor, the reader preview, technical review with comments, validating a hypothesis, publish and withdraw, with desktop captures 01–08, tablet capture 09 and state captures 14–21 in [design r01](../../../reference/ui/knowledge-authoring/knowledge-authoring-design-r01/README.md). Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 10–13 in [design r01](../../../reference/ui/knowledge-authoring/knowledge-authoring-design-r01/README.md): capture a learning item from a visit, and the reviewer's approve screen, at 390 and 320 (D12).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Knowledge authoring design r01 captures](../../../reference/ui/knowledge-authoring/knowledge-authoring-design-r01/README.md) (accepted Figma design, icon-free)
- [PPO-Knowledge-Authoring-Review-and-Learning-Intake-r01.html](../../../reference/ui/knowledge-authoring/PPO-Knowledge-Authoring-Review-and-Learning-Intake-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.dk.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
