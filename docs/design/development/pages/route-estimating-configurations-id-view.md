# Screen Systems configurations · selected view — design reference

Stable entry: `route:/estimating/configurations/[id]/[view]`. Owner: Dean Fiedler. Status: **Built to the accepted design board; owner visual review pending**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`; native workbench built 12 October 2026 ([build record](../../../decisions/es08-workbench-build.md)). Application destination: `/estimating/configurations/{id}/{view}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The Screen Configurator Workbench for one Screen Systems configuration. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Enter the configuration UUID from the target environment.
2. Choose a view: configure, drawings, parts, pricing, compare, definition or history. The module header keeps the context band, the seven views and the six readiness gates on every view.
3. Inspect that view in the same configuration context; saved runs, working inputs and reviewed definitions remain distinct evidence.
4. Wider workflow outcome: a reproducible specialist configuration with an exact input/rule basis, a coordinated drawing set and a price bridge that reproduces the recovered rounding policy.

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. The module owns its secondary menu, module header, views and one scrolling owner (`.es08-scroll`; the whole layout below 1,100 px).

Built composition, from the design board (1,440 px):

- **Module header.** Breadcrumb "Specialist configurations / Screen Configurator Workbench" (shell top bar amendment, 16 October 2026); h1 "Screen Configurator Workbench"; the record line with the configuration name, display number and draft version; draft status and Method & limitations; the five-cell context band (estimate, facility, structure, definition, review state); the seven views as a tab row with counts; the six-gate readiness strip (Geometry, Structural grid, Cloth width, Roll fit, Manual quantities, Release), every gate stated in words.
- **Configure.** Section list 236 px (horizontal row when the module is narrower than 1,240 px), form card, live card 440 px (380 px when narrower). Options are segmented buttons with 44 px targets; every field shows its source cell; drawing-only inputs carry a "Drawing only" badge and withhold drawings only; the derived-geometry readout and the calculation working list follow the board.
- **Drawings.** Toolbar with the roof profile, four layer switches and sheet anchors; sheet 01 with the field inspector, legend and limits beside it; sheets 02–05 full width; cut schedule beside the coverage cross-check. Title blocks read "Estimating study · not for fabrication".
- **Parts & working.** Search, four segmented filters, section select; positions table with PPO part, source position, review quantity and basis; the working panel opens persistently at 420 px (a side dialog below 1,100 px).
- **Pricing.** Rule strip; priced lines with inline rate editing; price bridge and rounding-policy card at 400 px; the native AUD receiving proposal below.
- **Compare & save.** Compare-against control (saved run or scratch baseline); headline comparison and line changes by stable key; record-run card with checklist and acknowledgement; Send to estimate.

Composition adapts to the module's own width through container queries (three columns from 1,240 px, side panels from 900 px, one column below), because the shell's rail and docked secondary menu leave about 1,124 px at a 1,440 px viewport. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px the same views and tasks remain. The header stacks (two-column context band and gates); the views row scrolls; Configure replaces the section list with a stepper and progress bar; fields stack with 16 px input text and 48 px targets; sheets scale with the viewport and rely on pinch zoom; the working panel and the manual review open as full-height side dialogs; the save bar sits above the shared phone navigation.

Design board boards D and E are the owner-accepted phone composition. The built phone composition is captured below; it has not been visually reviewed on a device.

## Shared components and states

Global Roboto/Verdana typography and the r22 semantic tokens through the shared secondary-menu scope. Shared `ppo-button` controls (restated inside the id-scoped workspace), segmented buttons, pills and notices from `src/components/specialist-ui.tsx`, the shared cross-section drawing (`cross-section`), and the drawing sheets. Primary/secondary/quiet/danger meanings, hover, visible focus, disabled and loading states are present.

States built from board C: loading skeleton, missing or denied context, validation withheld (field names the rule; Geometry gate Withheld), drawing withheld (quantities valid), untested option, read-only reviewer and locked estimate, stale preview, outcome unknown with receipt recovery, saving, failed before commit, saved, missing rate (total unavailable, partial sums labelled), filtered empty, roll too narrow (DEC-R2), server version changed. Status always includes words.

## Visual references

Design board (owner-accepted, 23 September 2026):

- [PPO-Specialist-Configuration-Workbench-r03.html](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-r03.html)
- [PPO-ES-08-Design-Board-01-Configure-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-01-Configure-r01.png) — Configure, desktop 1440 × 1980
- [PPO-ES-08-Design-Board-02-Drawings-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-02-Drawings-r01.png) — Drawings, five sheets and cut schedule, desktop 1440 × 4160
- [PPO-ES-08-Design-Board-03-Parts-and-Working-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-03-Parts-and-Working-r01.png) — Parts & working, desktop 1440 × 1500
- [PPO-ES-08-Design-Board-04-Pricing-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-04-Pricing-r01.png) — Pricing, desktop 1440 × 1400
- [PPO-ES-08-Design-Board-05-Compare-and-Save-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-05-Compare-and-Save-r01.png) — Compare & save, desktop 1440 × 1500
- [PPO-ES-08-Design-Board-C-States-and-Recovery-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-C-States-and-Recovery-r01.png) — sixteen states and recovery, 1440 × 1680
- [PPO-ES-08-Design-Board-D-Phone-Configure-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-D-Phone-Configure-r01.png) — phone Configure, 390 × 844
- [PPO-ES-08-Design-Board-E-Phone-Drawings-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-E-Phone-Drawings-r01.png) — phone Drawings, 390 × 844
- [PPO-ES-08-Design-Board-F-Module-Header-r01.png](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-F-Module-Header-r01.png) — shared module header, 1440 × 336

Application captures (native workbench, 12 October 2026, headless Chrome, synthetic fixture; [sizes and hashes](../../../reference/ui/specialist/workbench-native-r01/README.md)):

- [PPO-ES-08-Native-01-Configure-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-01-Configure-1440-r01.png) — Configure, 1440 px, secondary menu collapsed
- [PPO-ES-08-Native-01-Configure-docked-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-01-Configure-docked-1440-r01.png) — Configure, 1440 px, secondary menu docked
- [PPO-ES-08-Native-02-Drawings-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-02-Drawings-1440-r01.png) — Drawings, 1440 px
- [PPO-ES-08-Native-03-Parts-working-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-03-Parts-working-1440-r01.png) — Parts & working with the working panel open, 1440 px
- [PPO-ES-08-Native-04-Pricing-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-04-Pricing-1440-r01.png) — Pricing, 1440 px
- [PPO-ES-08-Native-05-Compare-1440-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-05-Compare-1440-r01.png) — Compare & save, 1440 px
- [PPO-ES-08-Native-D-Phone-Configure-390-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-D-Phone-Configure-390-r01.png) — phone Configure, 390 px
- [PPO-ES-08-Native-E-Phone-Drawings-390-r01.png](../../../reference/ui/specialist/workbench-native-r01/PPO-ES-08-Native-E-Phone-Drawings-390-r01.png) — phone Drawings, 390 px

The board artboards are design references; the application captures are implementation captures, not visual acceptance.

Figma proposal (12 October 2026): page "Screen Configurator Workbench · ES-08" `406:2` (formerly "ES-08 · Screen Configurator Workbench"; renamed on 25 October 2026 by the [Figma file audit](../../figma-file-audit/figma-file-audit-2026-10-24.md), R1) in "PPO - Design" — not accepted; no captures retained yet (see the [proposal record](../../../decisions/es08-figma-design.md)).

## Accepted design direction and the build

Dean accepted the ES-08 design board r01 on 23 September 2026 ([decision](../../../decisions/es08-design-board.md), [retained captures and hashes](../../../reference/ui/specialist/design-board-r01/README.md)). The native workbench was built from it on 12 October 2026; the [build record](../../../decisions/es08-workbench-build.md) states the points settled at implementation (slug `drawings`, the heading and record line, drawing-only inputs remembered per browser, the r03 roof list) and seven adaptations for review: the explicit save bar with a reason, Send to estimate kept as the working synthetic receiving flow, width-adaptive composition, SVG text labels, the retained section filter, the phone save bar and the record line.

## Figma design proposal — 12 October 2026

Dean asked for ES-08 to be designed in Figma so that it looks, reads and behaves like the pages accepted there since ADR-0053. The proposal is on the page "Screen Configurator Workbench · ES-08" `406:2` of the private Figma file "PPO - Design" (link not recorded): seven desktop views with the secondary menu docked, Configure and Drawings with it collapsed, four phone frames, states S1–S11 and a notes card. The [proposal record](../../../decisions/es08-figma-design.md) names every frame and component node, the accepted patterns reused, 17 new or proposed components and 23 proposed application changes (P1–P23), and the questions for Dean (Q1–Q7, including the four open points of the build record).

Status: **proposal, not accepted**. No named version is saved and no icon-free captures are retained yet; at acceptance they go in a new `docs/reference/ui/specialist/` revision folder and this record is updated. The application is unchanged; it is brought into line in a later build once the design is accepted.

Proposed desktop composition (1,440 px, rail expanded and secondary menu docked, 960 px content): record header with the configuration name as title, a flush context strip, the accepted readiness bar, Record / View tabs with counts, the view body and a sticky save bar. The secondary menu lists the current view's contents (Configure sections with status, drawing sheets and schedules, position filters, pricing parts, comparison parts, finding kinds, runs). Collapsed, the content widens to about 1,180 px.

Proposed phone composition (390 × 844): the accepted record phone pattern — back, readiness summary, text tabs, scrolling content and a footer with "…", Save draft and Next section above a live summary bar; the field inspector as a bottom sheet; the working panel full screen.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.configurations.id.view` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Verification recorded: `tests/unit/specialist-workbench.test.ts` (geometry against the decision's r10 figures, withholding rules, readiness gates, cut schedule, priced extensions) and the rewritten `tests/browser/specialist-workbench.spec.ts` (seven views, every profile through the shared section, drawing-only withholding, field selection, working panel, segmented receiving decisions, recovery, permission withdrawal). Acceptance evidence is pending: compare the retained application captures with the board at the same viewports, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## Figma implementation — 13 October 2026

Dean directly requested the live implementation of private Figma page `406:2`. See [the implementation decision](../../../decisions/es08-figma-implementation.md) for source nodes, r20 page types, shared components, incoming/outgoing handovers and declared adaptations. No parent scope or requirement IDs change. Issued HTML and historical captures above remain unchanged.

Desktop: flush record/context/readiness/tab bands, view-specific secondary menu, 24 px content padding, 16 px card gaps and sticky save bar. Configure uses two columns; Parts uses a 440 px overlay; Pricing puts the bridge below the table; Definition uses full-width findings/parameters; History exposes further actions through the shared overflow menu. Drawings retain dynamic shared geometry and separate estimate/configuration title-block facts.

Phone: compact record header, expandable readiness details, scrolling tabs, six-section stepper, persistent Save/Next controls and a Workbench actions sheet carrying the reason and calculation review. Parts working fills the screen; drawing selection opens an inspector bottom sheet. Verify keyboard focus/return, contained table scrolling, changed/invalid raw drafts and pending receipt recovery at 390 and 320 px.

The [component host](../components/screen-configurator-workbench.md) records states and bindings. [Execution evidence](../../../testing/evidence/es08-figma/README.md) separates functional checks and visual inspection. Missing source images: icon-free Figma source captures and an accepted named version are not recorded. No review fingerprint, owner acceptance or deployment status is inferred from implementation.
