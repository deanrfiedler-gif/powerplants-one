# Screen Systems configurations · detail — design reference

Stable entry: `route:/estimating/configurations/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/configurations/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Confirm the record reference and customer/site context in this record workspace.
2. Review required inputs and unresolved assumptions
3. Inspect calculation and generated-parts evidence
4. Review overrides and rerun impact before accepting a successor

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

- [PPO-Specialist-Configuration-Workbench-r03.html](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.configurations.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## Figma implementation — 13 October 2026

Dean directly requested the live implementation of private Figma page `406:2`. See [the implementation decision](../../../decisions/es08-figma-implementation.md) for source nodes, r20 page types, shared components, incoming/outgoing handovers and declared adaptations. No parent scope or requirement IDs change. Issued HTML and historical captures above remain unchanged.

Desktop: flush record/context/readiness/tab bands, view-specific secondary menu, 24 px content padding, 16 px card gaps and sticky save bar. Configure uses two columns; Parts uses a 440 px overlay; Pricing puts the bridge below the table; Definition uses full-width findings/parameters; History exposes further actions through the shared overflow menu. Drawings retain dynamic shared geometry and separate estimate/configuration title-block facts.

Phone: compact record header, expandable readiness details, scrolling tabs, six-section stepper, persistent Save/Next controls and a Workbench actions sheet carrying the reason and calculation review. Parts working fills the screen; drawing selection opens an inspector bottom sheet. Verify keyboard focus/return, contained table scrolling, changed/invalid raw drafts and pending receipt recovery at 390 and 320 px.

The [component host](../components/screen-configurator-workbench.md) records states and bindings. [Execution evidence](../../../testing/evidence/es08-figma/README.md) separates functional checks and visual inspection. Missing source images: icon-free Figma source captures and an accepted named version are not recorded. No review fingerprint, owner acceptance or deployment status is inferred from implementation.
