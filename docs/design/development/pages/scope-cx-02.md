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

Accepted design: the [Workshop builds design decision](../../../decisions/workshop-builds-figma-design.md) of 19 October 2026 covers `/workshop` (Supply chain rail "Workshop", proposed) and a build record at `/workshop/[id]` (proposed), with sixteen icon-free captures in [design r01](../../../reference/ui/supply-chain/workshop-builds-design-r01/README.md). Departures D1–D8 and the answers to Q1–Q6 are recorded there: a grid register of builds, a record with build checks and six tabs, a read-only parts list from released materials with booking out, steps with the welder's qualification and weld inspection, tests whose result follows from value and limit, rework, release by the workshop lead (never the builder) with a serial number, and hand-over for dispatch. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 08–16 in [design r01](../../../reference/ui/supply-chain/workshop-builds-design-r01/README.md): the list with the compact phone header, the build record at 390 and 320 with one full-width main action, a Record test result form, and five states. The phone tab bar shows My Work, Receiving, Inventory, Workshop and More.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Icon-free Figma captures of the Workshop builds page: [Workshop builds design r01](../../../reference/ui/supply-chain/workshop-builds-design-r01/README.md). Kitting & controllers and Bench testing & returns have their own entries and are not drawn yet. No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [design r01](../../../reference/ui/supply-chain/workshop-builds-design-r01/README.md) captures (design compositions, not application captures) and its [decision](../../../decisions/workshop-builds-figma-design.md). A build needs a workshop build model with its migration and permissions, a released-materials read, and the MYOB send adapter under its own decision. The Booked out and Rework tabs at full size, the New build form, desktop states and the tablet record are not drawn. The named Figma version "Workshop builds — accepted" waits for Dean's yes.

The draft User Guide `guide.cx.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
