# Staged acceptance and closeout — design reference

Stable entry: `scope:PJ-09`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/acceptance`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The native workflow exists at the root and six supporting routes. Refine and integrate it from [ADR-0033](../../../decisions/ADR-0033-staged-acceptance.md), the [implementation handover](../../../delivery/pj09-staged-acceptance-handover.md) and [executed PJ09-01–56 evidence](../../../testing/evidence/project-acceptance-r01/README.md). The stale unbuilt scope classification is corrected to refine; this grants no owner acceptance or deployment claim.

1. Review stage-specific completion and exceptions
2. Record receiving decisions with exact evidence
3. Keep technical, customer and commercial closure distinct

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

- [Supplied desktop composition](../../../reference/project-acceptance/PPO-PJ-09-Staged-Acceptance-and-Closeout-Desktop-UI-Mockup-r01.png), SHA-256 `9d3cf7edb1d6184d14bc9d1a4c42c97a4d3ba2ddc2c2d2004ca6e54febe3b242`.
- [Written r02 build contract](../../../reference/project-acceptance/PPO-PJ-09-Staged-Acceptance-and-Closeout-Build-Plan-r02.md) and ADR-0033 adaptations govern beyond the raster composition. An exact accepted phone mockup is not supplied; prior implementation captures remain evidence, not a replacement design baseline.

Page type: Register / worklist, supporting record detail, review, evidence workspace and focused forms. Reuse the actual shared shell, module menu, Button controls and global information guide. Preserve full-bleed layout, the documented 220px white module menu and 464px inspector only when at least 760px of list space remains. Six default columns, 14/20 typography and natural wrapped rows are deliberate PJ-09 geometry; do not replace them with newer shared defaults merely for uniformity.

Incoming handover is exact permitted EN-08 technical/test/configuration evidence plus labelled synthetic supplementary sources. Outgoing handovers are exact OUT-13, recorded customer responses, independently accepted Service receiving and owned residual obligations. Neither Project progress nor Activity completion grants technical/customer/commercial acceptance. Original-operation recovery uses server-held intents and current authority.

## Behaviour, handovers and verification

The draft User Guide `guide.pj.09` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
