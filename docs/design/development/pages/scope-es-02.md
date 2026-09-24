# Estimation Wizard · discovery, alternatives & revisions — design reference

Stable entry: `scope:ES-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/discovery`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Retain the native five-step wizard delivered by PR #272, including exact revision comparison, structured multi-area scope, source-change handling, immutable alternatives and saved-cost reads. The 24 September reconciliation updates the workload return link and removes obsolete wording that denied the now-native ES-08 specialist integration. No discovery DTO, hash, command, schema or costing guarantee changes.

1. Review Requirements, Configuration, Scope & delivery, Pricing and Review
2. Keep alternatives and their exact revisions distinct
3. Check the saved cost basis before preparing a quotation

**Design board r01, 24 September 2026.** An in-app design board re-bases the wizard onto the running shell and build plan r04 and compares it with the running build on `main` `72b2769`. It records one user decision: six equipment families with 108 categories replace r04 §4.7's four presentation groups (23 September 2026). Implementing that needs a successor to configuration definition `PPO-ES02-CONFIG-r01`, a migration and an ADR amending ADR-0035; none is authorised. The board's proposals P2–P9 and open decision O1 are not accepted. It also records six findings against the running build (B1–B6). See the [design board record](../../../decisions/es02-design-board.md); the page-level contract, with measured geometry, is in [the discovery workspace entry](route-estimating-discovery-id.md).

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

The measured desktop composition of the running wizard, and the board's proposed alternative, are recorded in the [discovery workspace entry](route-estimating-discovery-id.md#desktop). Desktop control height (36 px in the wizard against the 44 px shared token) is open decision O1.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

On phones the running wizard renders fields at 14–14.4 px and controls at 30–38 px (findings B3 and B4); the board proposes 16 px fields and 44 px controls. Measurements are in the [discovery workspace entry](route-estimating-discovery-id.md#mobile).

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [read-only-summary.png](../../../testing/evidence/es02-native-r01/read-only-summary.png)
- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)
- [Design board r01](../../../reference/ui/estimating/design-board-r01/README.md) — 30 artboards, proposed and not accepted; key boards: [06 · Equipment families](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-06-Equipment-Families-r01.png) (1440 × 1780), [07 · Departures](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-07-Departures-and-Build-Findings-r01.png) (1440 × 1440), [04 · Design versus current build](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-04-Design-Versus-Current-Build-r01.png) (1440 × 2500), [S2 · Configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S2-Configuration-r01.png) (1440 × 1770) and [R2 · Phone configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R2-Phone-390-Configuration-r01.png) (390 × 844)
- [Paired build evidence](../../../testing/evidence/es02-design-board-r01/README.md) — application captures and measurements on `main` `72b2769`

## Behaviour, handovers and verification

The draft User Guide `guide.es.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
