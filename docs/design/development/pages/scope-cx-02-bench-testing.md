# Bench testing and returned units — design reference

Stable entry: `scope:CX-02/bench-testing`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `47e47361f3bc9f321795117d357a8053d923cfb9`. Proposed application destination: `/workshop/bench-testing`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Workshop page 3 of 3 under `scope:CX-02` ([PPO-WORKSHOP-SETTINGS-SCOPE-DEC](../../../decisions/workshop-settings-preferences-scope.md), WS-D3). The other workshop pages are [Workshop builds](scope-cx-02.md) and [Kitting and controller preparation](scope-cx-02-kitting.md).

1. Receive a returned unit against its serial number and customer.
2. Bench-test it and record the results.
3. Repair or reject it, and record the outcome.

Related records: warranty cases (`scope:MA-06`), returns and supplier claims (`scope:SC-08`) and test instruments and calibration (`scope:EQ-09`). MYOB Acumatica stays the book of record for stock and costs (option A). The destination `/workshop/bench-testing` is proposed; no route or source exists yet.

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

No exact image or HTML reference is linked, and this page has not been drawn in Figma yet. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.cx.02.bench-testing` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
