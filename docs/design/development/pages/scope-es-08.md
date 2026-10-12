# Specialist configuration workbench — design reference

Stable entry: `scope:ES-08`. Owner: Dean Fiedler. Status: **Built to the accepted design board; owner visual review pending**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`; native Screen Configurator Workbench built 12 October 2026 ([build record](../../../decisions/es08-workbench-build.md)). Application destination: `/estimating/configurations`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement the validated Screen Systems specialist workbench: governed inputs, calculations, generated parts, overrides and safe rerun, with the coordinated drawing set and the roll-fit check the design board brought in from blueprint r10. Other calculators require separately validated scope.

1. Review required inputs and unresolved assumptions
2. Inspect calculation, drawing and generated-parts evidence
3. Review overrides and rerun impact before accepting a successor

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. The register at `/estimating/configurations` is a register/worklist; each configuration opens the Screen Configurator Workbench, a record/evidence workspace whose desktop and mobile contract is in [the view record](route-estimating-configurations-id-view.md). Match the linked page-specific references; retain their accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Design board boards D and E are the owner-accepted phone composition (390 × 844). The built phone composition is captured in the view record; it has not been visually reviewed on a device.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states. The workbench adds the shared cross-section drawing (`cross-section`) and its drawing sheets; segmented buttons replace selects (departure D10).

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

Application captures of the built workbench (12 October 2026) are listed in [the view record](route-estimating-configurations-id-view.md#visual-references) with their [sizes and hashes](../../../reference/ui/specialist/workbench-native-r01/README.md). The board artboards are design references; the application captures are implementation captures, not visual acceptance.

## Accepted design direction and the build

Dean accepted the ES-08 design board r01 on 23 September 2026 ([decision](../../../decisions/es08-design-board.md), [retained captures and hashes](../../../reference/ui/specialist/design-board-r01/README.md)). It merges workbench r03 inputs with the r10 drawing set; the acceptance covers the board's desktop (1440 px) and phone (390 px) compositions, departures D1–D15 and rulings DEC-R1 and DEC-R2. The native workbench was built from it on 12 October 2026: the module header with the six-gate readiness strip, seven views including Drawings, segmented options with source cells, drawing-only inputs that withhold drawings and never quantities, one shared cross-section component for five roof profiles, the five-sheet drawing set with title blocks, and the sixteen states of board C. The [build record](../../../decisions/es08-workbench-build.md) lists the points settled at implementation and the adaptations for Dean's review. The recovered engine, commands, receipts, recovery and receiving are unchanged.

## Behaviour, handovers and verification

The draft User Guide `guide.es.08` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Compare the retained application captures with the board at the same viewports, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
