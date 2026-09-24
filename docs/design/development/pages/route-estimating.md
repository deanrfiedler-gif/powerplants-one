# Estimating intake and workload — design reference

Stable entry: `route:/estimating`. Owner: Dean Fiedler. Status: **Draft for visual review**.

The 24 September native increment changes this route to the permitted intake/workload front door; saved estimates remain at `?tab=estimates`. On 25 September 2026 the ES-01 design decisions (P1–P9, O1–O2, taken under Dean's delegation) were implemented here: a register with a persistent detail panel from 1360 CSS px, a drawer below it, phone cards, readiness counts and a saved-estimate table. Use the exact desktop/mobile, state, filter, authority and handover contract in [ES-01](scope-es-01.md). This route has no exact retained mockup; the ES-02 wizard HTML is not its visual baseline. Reused controls remain PageHeader, Button/ButtonLink, ErrorNotice, Status and the current shell. See the [programme handover](../../../delivery/estimating-programme-handover.md) for executed evidence and remaining intake-policy limitations.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Find the intake or existing estimate
2. Check scope completeness and required clarification
3. Assign or review the next estimating action

## Desktop

Implemented composition (ES-01 decisions P1–P5, P7, O1): section tabs, then a filter row with search, owner and sort, then Scope readiness segments with permitted counts, then the register. At 1360 CSS px and wider a 448 px sticky panel shows the selected opportunity; below that, selecting a row opens a 448 px right-hand drawer. Exact rules are in [ES-01](scope-es-01.md#desktop).

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Implemented composition (P5, P7): at 760 CSS px of register width and below, cards carry the full detail, and one disclosure button holds readiness, owner and sort with a summary of the retained selections. The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No exact ES-01 mockup or HTML is available. The related [ES-02 wizard](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) is a downstream workflow reference, not the workload layout baseline.

The [ES-01 design board r01](../../../reference/ui/estimating/workload-design-board-r01/README.md) is retained: 14 artboards in the Powerplants One design system. Its proposals were decided under delegation on 25 September 2026 and implemented with the adjustments in the record; the board itself is a design reference, not an accepted baseline. Key boards: [D1 · Workload desktop](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D1-Workload-Desktop-1440-r01.png) (1440 × 1400), [D2 · Saved estimates](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D2-Saved-Estimates-Desktop-1440-r01.png) (1440 × 900), [R1 · 1024 drawer](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R1-Tablet-1024-Drawer-r01.png) (1024 × 768), [R2 · Phone 390](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R2-Phone-390-Workload-r01.png) (390 × 2112) and [R4 · Phone 320](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R4-Phone-320-Workload-r01.png) (320 × 700). The user decision, the decided proposals P1–P9 and questions O1–O2, and build findings B1–B5 with their outcomes are in the [design board record](../../../decisions/es01-design-board.md). Running-build captures of the implementation are in the [adoption evidence](../../../testing/evidence/estimating-workload-design-adoption/README.md); they are not visual acceptance.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
