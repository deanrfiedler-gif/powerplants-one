# Create estimate — design reference

Stable entry: `route:/estimating/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Assign or review the next estimating action

Accepted design: the [Estimate detail design decision](../../../decisions/estimate-detail-figma-design.md) of 30 October 2026 (D6, Q3) keeps this page as a search-first entry that never duplicates. It opens an existing estimate or workspace, and otherwise offers Express estimate (Direct CPQ, CM2) or Start discovery, guarded by an accepted Sales brief. Cost lines move to CPQ, and unknown values stay explicit. Nothing new is built; until the matching build steps are delivered, the running page keeps its manual cost lines and the rest of this entry describes it.

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

- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)
- Accepted Figma design: captures 08–10, 20 and 21 in [Estimate detail design r01](../../../reference/ui/estimating/estimate-detail-design-r01/README.md) (design compositions, not application captures) and its [decision](../../../decisions/estimate-detail-figma-design.md). Create estimate at tablet and phone sizes is not drawn.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
