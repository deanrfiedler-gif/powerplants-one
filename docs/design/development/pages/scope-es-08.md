# Specialist configuration workbench — design reference

Stable entry: `scope:ES-08`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/configurations`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement the validated Screen Systems specialist workbench: governed inputs, calculations, generated parts, overrides and safe rerun. Other calculators require separately validated scope.

1. Review required inputs and unresolved assumptions
2. Inspect calculation and generated-parts evidence
3. Review overrides and rerun impact before accepting a successor

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Design board r01 boards D and E are the owner-accepted phone composition (390 × 844). The application's mobile composition has not been visually reviewed for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Specialist-Configuration-Workbench-r03.html](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html)
- [PPO-ES-08-Design-Board-01-Configure-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-01-Configure-r01.png) — Configure, desktop 1440 × 1980
- [PPO-ES-08-Design-Board-02-Drawings-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-02-Drawings-r01.png) — Drawings, five sheets and cut schedule, desktop 1440 × 4160
- [PPO-ES-08-Design-Board-03-Parts-and-Working-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-03-Parts-and-Working-r01.png) — Parts & working, desktop 1440 × 1500
- [PPO-ES-08-Design-Board-04-Pricing-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-04-Pricing-r01.png) — Pricing, desktop 1440 × 1400
- [PPO-ES-08-Design-Board-05-Compare-and-Save-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-05-Compare-and-Save-r01.png) — Compare & save, desktop 1440 × 1500
- [PPO-ES-08-Design-Board-A-Conformance-Declaration-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-A-Conformance-Declaration-r01.png) — conformance declaration, 1440 × 3180
- [PPO-ES-08-Design-Board-B-Structure-Families-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-B-Structure-Families-r01.png) — structure families drawing standard, 1440 × 2240
- [PPO-ES-08-Design-Board-C-States-and-Recovery-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-C-States-and-Recovery-r01.png) — sixteen states and recovery, 1440 × 1680
- [PPO-ES-08-Design-Board-D-Phone-Configure-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-D-Phone-Configure-r01.png) — phone Configure, 390 × 844
- [PPO-ES-08-Design-Board-E-Phone-Drawings-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-E-Phone-Drawings-r01.png) — phone Drawings, 390 × 844
- [PPO-ES-08-Design-Board-F-Module-Header-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-F-Module-Header-r01.png) — shared module header, 1440 × 336
- [PPO-ES-08-Design-Board-G-Cross-Section-Engine-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-G-Cross-Section-Engine-r01.png) — shared cross-section component, 1280 × 310

The board artboards are design references, not application captures. No application capture is yet linked for this entry.

## Accepted design direction

Dean accepted the ES-08 design board r01 on 23 September 2026 ([decision](../../../decisions/es08-design-board.md), [retained captures and hashes](../../../reference/ui/specialist/design-board-r01/README.md)). It merges workbench r03 inputs with the r10 drawing set. The acceptance covers the board's desktop (1440 px) and phone (390 px) compositions, departures D1–D15 and rulings DEC-R1 and DEC-R2. It is a design reference: the application page has not been compared with it, and the visual review below remains pending.

What the board specifies, for comparison at implementation:

- **Module header.** Breadcrumb, page heading, autosave status and Method & limitations, with no module Help button because the shell owns the information icon. Below them sit a five-cell context band (estimate, facility, structure, definition, review state), seven views (Configure, Drawings, Parts & working, Pricing, Compare & save, Definition review, Run history) and a six-gate readiness strip visible on every view.
- **Configure.** Six sections (structure, cloth, bed, drive, supports, commercial), with options shown as segmented buttons with 44 px targets. A live card toggles Plan and Section. Drawing-only inputs carry a "Drawing only" badge, and their errors withhold drawings but not quantities.
- **Drawings.** A toolbar with the roof profile, layer switches and sheet navigation. Five A3 landscape sheets (plan, cross section, longitudinal section, bay section, screen cut) each carry a title block marked "Estimating study · not for fabrication". A linked field inspector, legend, cut schedule and unpriced coverage cross-check complete the view.
- **Structure drawing.** Five roof profiles (Venlo, Gable, Arch, Gothic, Sawtooth) come from one shared cross-section component, following the decision's drawing standard.
- **States.** The sixteen states and recoveries on board C.

## Behaviour, handovers and verification

The draft User Guide `guide.es.08` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
