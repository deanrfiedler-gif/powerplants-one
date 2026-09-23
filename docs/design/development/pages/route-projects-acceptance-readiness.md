# Project acceptance & closeout · readiness — design reference

Stable entry: `route:/projects/acceptance/readiness`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/acceptance/readiness`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Identify the stage, required acceptance evidence and current source versions.
2. Review fulfilled, missing and stale prerequisites separately.
3. Prepare an owned action for each unresolved condition; readiness alone is not customer acceptance.
4. Wider workflow outcome: Each stage has a reviewed disposition and owned residual work.

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

The [PJ-09 scope design](scope-pj-09.md) links the supplied desktop composition, written r02 contract, ADR-0033 adaptations and prior native evidence. Preserve the documented module geometry. Exact accepted phone mockup remains unavailable.

## Behaviour, handovers and verification

The draft User Guide `guide.page.projects.acceptance.readiness` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Prior component and compiled visual evidence is retained in the [PJ-09 verification record](../../../testing/evidence/project-acceptance-r01/README.md). A0 performs source reconciliation only. Fresh family regression, native guide walkthrough, owner/device acceptance and deployment remain separate. Do not replace a comparison image simply to make a test pass.
