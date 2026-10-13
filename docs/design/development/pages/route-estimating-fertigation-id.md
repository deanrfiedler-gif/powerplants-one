# Priva Fertigation Configurator · detail — design reference

Stable entry: `route:/estimating/fertigation/[id]`. Owner: Dean Fiedler. Status: **Aligned to the accepted Figma design; draft for owner visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/fertigation/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Confirm the record reference and customer/site context in this record workspace.
2. Select or create the permitted configurator scope
3. Review the exact valve and master-source revisions and unresolved bindings
4. Inspect calculated results and review evidence before preparing a controlled report

## Page-specific guidance

The record workspace is built to the [retained design board captures r01](../../../reference/ui/estimating/fertigation-design-board-r01/README.md) on 12 October 2026 ([workbench refinement record](../../../decisions/fertigation-workbench-refinement.md), "Built to the board"). Every figure on the page is an entered value or a `PPO-FERT-NATIVE-CALC-r01` result; charts place them on one scale and never recalculate. The [board parity register](../../../testing/priva-fertigation-board-parity.csv) records each region's status against the board.

- **Record header (board J, D2).** The scope name and its reference chip; a status pill in the native words (Saved revision N, Unsaved changes, Conflict — proposal retained, Historical revision · read-only, Archived · saved revision N) with the saved time in the S6 format; Irrigation valves (jumps to the valve register), History, the Scope actions menu containing Report (the saved revision's customer report), Compare draft while the draft is dirty, and the one primary action, Save revision. The context row shows the captured site and customer, "Bound to Discovery alternative {label} · revision {n} · source unchanged/changed", the scope state, the operating scenario (a select bound to the draft's `selected_scenario_id`) and the Synthetic demonstration chip.
- **Rail (board K, D1).** Scope readiness (open findings, basis, segmented bar and legend), the three groups Define the farm · Test the operating basis · Prepare the scope with an icon per view, a severity badge (conflict, then incomplete, then review) or a check only for Scope review when the calculation has no findings, then Scope register, Return to Discovery alternative and the calculation edition. The badge is hidden from the accessible name and announced through `aria-describedby`.
- **Page head.** "{Group} · {n} of 9", the board's section title, a one-line lede and the section's actions. A page footer names the calculation edition, the reference, the revision and synthetic data.
- **Overview (board 01).** In order: next actions numbered with conflicts and candidate failures first and a role chip, what this scope can produce now beside the declarations the draft needs (F1), six metric tiles with a Calculated tag and the input basis in words (connected flow and peak operating flow trace to How this is calculated), capacity headroom with a legend and a 0–100–200% axis (a breach of a configured candidate's entered envelope or channel range reads Candidate failure, as in Next actions; breaches the engine raises as findings read Conflict), the system concept (source → pump → filtration → fertigation → mainline, then the blocks with their valves and engine flows; each card opens its register), evidence maturity and the project brief with Edit production context. Validate & calculate draft sits in the page head; an uncalculated draft shows the "Draft changed…" notice in place of the tiles.
- **Growing areas & irrigation (board 02).** Four tiles, then the register tabs (valves first, then mainlines, growing areas, crop groups) with the board's columns, then the allocation schematic (source → mainline → valve → cohort with the recorded emitter derivation). Export valve CSV is the page action.
- **Water & hydraulics (board 03).** The pump curve & duty range panel (engine interpolation, duty table, margin notice) beside the required duty build-up (entered components, required head, curve head and margin as bars, the formula), then the register tabs. Edit pump & duty is the page action.
- **Recipes & dosing (board 04).** The agronomic-input notice, the register tabs, then injection requirement by operating group (entered channel range against the engine's required injection; a channel outside its entered range reads Candidate failure with the engine's failure text, its channel named once).
- **Controls & I/O (board 05).** Four tiles, I/O capacity drawn channel by channel from the entered counts and the engine's required, available and spare, the register tabs and the GroScales scope.
- **Operating plan (board 06).** Four tiles, the scenario for review & output (Selected saved scenario), the irrigation timeline and first-cycle detail from the engine's events and intervals, the storage & refill balance gauge from the engine's minimum, final and overflow, the register tabs, crop delivery coverage and the scenario comparison.
- **Unit configurator (board 07, D5).** Four tiles, the configured candidates against the engine's required range (entered envelopes only, the engine's status, Shortlist and Configure; families without a candidate offer Configure), the shared candidate failures stated once, and the constraint details region.
- **Evidence & delivery (board 08).** The register tabs (evidence references, responsibilities & open actions), the site services and resilience facts with their editors, and the prepared files panel.
- **Scope review (board 09).** Three severity tiles and the edition, open findings grouped by the resolving view with severity and role filters, revision & output actions, and a right column with the technical review record, the scoping handover steps and receiving effect, and the retained reports.
- **Drawers.** Calculation trace, Resolve a conflict, Make a declaration and Compare draft are unchanged in behaviour and restyled.
- **Registers.** Each register panel uses the shared register table (ADR-0051 group 2) with Find in register, the phase, area and master filters, 25-row pages, the row label opening the record and Edit/View and Remove through the fixed right-hand row action menu.

Departures from the captures and their authority are listed in the parity register; the main ones are the tabbed registers (FN-T61 keeps the chosen register's add action above the fold), the engine-withheld I/O balance, the entered-envelope comparison (ADR-0038) and the storage gauge (the engine exposes no series). Gated behind calculation edition r02: first arrival and stock endurance, the three proposed checks, sensitivity and break-even.

## Desktop

Accepted design (12 October 2026): the [Priva Fertigation Workbench Figma design decision](../../../decisions/fertigation-figma-design.md), with captures 01–12 in [Figma design r01](../../../reference/ui/estimating/fertigation-figma-design-r01/README.md). The running source adopts the accepted composition under the [13 October implementation decision](../../../decisions/fertigation-figma-implementation.md). The earlier board remains the content reference.

- **Layout at 1440 × 1000:** the Shell v2 rail with Specialist configurations current; the breadcrumb "Scope register / SYN-PPO-FRT-000001"; the flush secondary menu with Scope readiness, the three groups with severity badges, then Scope register, Return to Discovery alternative and the edition. Below the top bar: the one-row record header, the context strip, then the scrolling view.
- **Header:** title and status tag (Saved revision N, Unsaved changes, Conflict — proposal retained, Historical revision · read-only, Archived), History as the one secondary action, Save revision as the primary action, and "…" for Report, Irrigation valves, Compare draft, the exports and copy, restore and archive. The meta line carries the reference, scope state, Discovery binding and saved time.
- **Views:** section headings outside white cards; metric tiles with basis tags; registers on the shared grid with Record / View tabs, filter buttons, Find in register, Add and the row "…" menu; charts in the pastel-with-outline palette with no navy fills; Channel A as "Candidate failure".
- **Overlays:** Resolve a conflict and Calculation trace as right-hand drawers and History as a centred dialog, each with a transparent click-catcher (captures 10–12).

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

Current geometry: the detail route starts with an expanded 240 px primary rail (unless a stored preference overrides it), a 240 px secondary menu and 24 px content gutters; tiles are four across (three across for the six Overview tiles); panels are white on the paper ground with 8 px radii; chart text is 11–13 px and never scales. At 1280 px and below tiles fall to two across and the Scope review column stacks; at 1100 px and below the two-column panels stack. Captures at 1440 × 1000 were taken against the board reference scope on 12 October 2026 (see Visual references). Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design (12 October 2026): capture 13 in [Figma design r01](../../../reference/ui/estimating/fertigation-figma-design-r01/README.md). At 390 × 844 the phone header shows the page name only ("Priva fertigation scope"), then a compact record block, the section picker that opens a sheet with the groups and badges, the view as list rows (the valve register as rows with flow, mainline, phase, allocation and evidence), 2 × 2 tiles, and the Report / Save revision bar above the icon-only tab bar with More current. Not drawn yet: the other seven views on the phone and the phone versions of the states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Current phone composition (accepted Figma): a compact header (name, reference, status, Scope actions, scope state, operating scenario and the synthetic chip; the site and customer move to the project brief), a section picker opening a native modal sheet with the three group headings and open counts, the page head without its lede, the registers immediately after the page head, 2 × 2 tiles, stacked panels, capacity rows as cards and a Report / Save revision bar fixed above the shell's tab bar. The phone keeps the global Page guide and account controls reachable beside its page name; this preserves the application guidance and identity contracts. Find and filter expands search and filters beside Add valve. The register tabs scroll sideways in one row; the valve register uses labelled list rows, while other register tables scroll inside their panel. Drawers fill the viewport through the shared dialog. The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

The module's presentation kit (`src/components/fertigation-ui.tsx`: page head, panel, tiles, chips, tokens, notices, steps, legend, buttons) and its charts (`src/components/fertigation-charts.tsx`) are page-specific exceptions documented here; the shared register table is the house component. Status always carries words: Conflict, Incomplete and Review chips, Not recorded and To confirm tokens, Existing/Proposed/Future phase chips and the Calculated/Entered/Declared/Assumed basis tags.

Review loading (skeleton), empty (register and no matches), filtered-empty, read-only/denied, missing context, validation error, stale revision (Conflict — proposal retained), saving, uncertain result (Unknown tokens) and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Design reference (direction given, not accepted): the [retained design board captures r01](../../../reference/ui/estimating/fertigation-design-board-r01/README.md), 21 PNG artboards with hashes, from the private design canvas that refines the r02 standalone workbench (SHA-256 `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`). For this route:

- the nine views at 1440 px: boards 01–09;
- the Overview at 390 px: board A;
- the Resolve and Calculation trace drawers: boards B and C;
- revision compare: board D;
- the customer report: boards E and F;
- phone site visit: board G, not built (F8);
- states: board H;
- design language: board I;
- the shared header and rail: boards J and K.

Accepted Figma design (12 October 2026): [Priva Fertigation Workbench Figma design r01 captures](../../../reference/ui/estimating/fertigation-figma-design-r01/README.md), fourteen icon-free PNGs (design compositions, not application captures), recorded by the [design decision](../../../decisions/fertigation-figma-design.md). The board captures above stay unchanged as the content reference; the Figma design governs appearance.

Application captures (working evidence, not a visual review): [fertigation-board-parity](../../../testing/evidence/fertigation-board-parity/README.md), the nine views at 1440 × 1000 and 390 × 844, the register, the create page and the editor, resolve, trace and history dialogs, taken against [`boardReferenceScope`](../../../../tests/helpers/fertigation-board-scope.ts) (FN-T117) on the local dev server on 12 October 2026. The [parity register](../../../testing/priva-fertigation-board-parity.csv) pairs each board region with its application element. No accepted visual baseline exists for this route; departures are raised in the [workbench refinement record](../../../decisions/fertigation-workbench-refinement.md).

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.fertigation.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current implementation evidence

[13 October implementation evidence](../../../testing/evidence/fertigation-figma/README.md) records the actual checks against the same synthetic board fixture. FN-T118 covers all nine view destinations, menus, modal focus and saved-state preservation at desktop and phone widths. Existing source captures and accepted design images are retained unchanged. The host component record is [fertigation-workbench](../components/fertigation-workbench.md). Review fingerprints remain unset until an actual accepted review.
