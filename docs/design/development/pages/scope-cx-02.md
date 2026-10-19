# Workshop assembly, testing and rework — design reference

Stable entry: `scope:CX-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/workshop`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Dean confirmed the workshop as a full module on 19 October 2026 ([PPO-WORKSHOP-SETTINGS-SCOPE-DEC](../../../decisions/workshop-settings-preferences-scope.md), WS-D2 to WS-D5). It is designed as three pages. This entry is the first, **Workshop builds**; the other two are [Kitting and controller preparation](scope-cx-02-kitting.md) (`scope:CX-02/kitting`) and [Bench testing and returned units](scope-cx-02-bench-testing.md) (`scope:CX-02/bench-testing`). In the build sequence the module sits after Receipt, inspection and quarantine (SC-04) and before Picking and dispatch preparation (SC-06).

Workshop builds is a register of builds and a build record with tabs for:

1. the parts list, taken from released materials;
2. materials booked out;
3. steps and work instructions;
4. tests;
5. rework;
6. release, with a serial number.

Welding and fabrication check the welder's qualification against the competence records of the accepted Field team design (`scope:PL-02`), and record weld inspections with the controlled-form pattern of the accepted Inspections design (`scope:FI-03`, `scope:FI-04`).

Under option A, staff do this work in Powerplants One and MYOB Acumatica stays the book of record: PPO sends the resulting stock movements and costs, and MYOB keeps items, stock, purchasing, stock valuation and financial reporting. No MYOB endpoint, entity or posting is designed here.

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

No exact image or HTML reference is linked, and no Figma page for the workshop has been drawn yet. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.cx.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
