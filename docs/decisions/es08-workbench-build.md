---
document_id: PPO-ES08-WORKBENCH-BUILD
date: 2026-10-12
owner: Dean Fiedler
status: Code delivered for review; owner visual acceptance, engineering and business acceptance remain separate
versioning: git
---

# ES-08 Screen Configurator Workbench — native build record

On 12 October 2026 Dean asked for the UI page of the Screen Configurator Workbench to be built from the [design board he accepted on 23 September](es08-design-board.md). This record states what was built, which questions that decision left to implementation and how they were settled, where the application departs from the board and why, and what has actually been checked. It adds no calculation rule, migration, capability, grant, seed or receiving-policy change. ADR-0034's engine, commands, receipts and recovery are unchanged.

Scope stays `scope:ES-08` at `/estimating/configurations/{id}/{view}`, tracing CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009. No parent requirement ID is added or renamed.

## 1. What was built

| Board artboard | Application |
|---|---|
| F · Shared module header | Breadcrumb, heading, draft status, Method & limitations dialog, five-cell context band, seven views, six-gate readiness strip on every view (D8, D11) |
| 01 · Configure | Six sections entered once; options as segmented buttons (D10); every field with its source cell; drawing-only inputs with badges (D5, D12, D13); live plan or live section (D15); calculation working; untested-option and LS-wire notices |
| 02 · Drawings | Seventh view (D1): toolbar with roof profile, layers and sheet navigation; sheets 01–05 with title blocks marked "Estimating study · not for fabrication"; field inspector; legend; cut schedule; coverage cross-check (D3); SVG, CSV and print exports |
| 03 · Parts & working | Search, segmented position filters, positions table with PPO part outcome and review basis, persistent working panel (a side dialog below 1100 px), inclusion-gate decisions, manual-quantity review |
| 04 · Pricing | Rule strip, priced lines with inline rate editing, price bridge reproducing the recovered rounding policy (DEC-R1), native AUD receiving proposal |
| 05 · Compare & save | Saved-run or scratch baseline (D9), headline comparison, line changes by stable key with in-place decisions, record-run checklist and acknowledgement, send to estimate |
| C · States and recovery | Loading skeleton, missing or denied context, validation withheld, untested, read-only, stale preview, pending receipt recovery, saving, failed before commit, saved, missing rate, filtered empty, roll too narrow (DEC-R2) |
| D, E · Phone | Section stepper with progress, stacked fields, scrolling views and sheets, side dialogs for working and review |
| G · Cross-section engine | `src/components/specialist-section.tsx`, one component for the Configure card and sheet 02 |

Source: `src/components/specialist-*.tsx`, `src/components/specialist-workbench.css`, `src/estimating/specialist/drawing.ts` (drawing model and geometry) and `src/estimating/specialist/workbench.ts` (presentation model over the engine's calculation). The superseded r03 schematic component `specialist-diagrams.tsx` is removed.

One shared file changes: the leave guard `src/components/discovery-navigation.ts` (also used by the estimation wizard and the fertigation workbench) no longer cancels a navigation whose `downloadRequest` is set. A download keeps the document, so unsaved work is not at risk; before the change, exporting run evidence or a drawing while the draft was unsaved opened the "Unsaved configuration changes" dialog and the file never arrived. The guard's anchor-click path already skipped `download` links; only the Navigation API path lacked the check.

## 2. Settled at implementation

The decision left four points to implementation.

| Point | Settled as | Basis |
|---|---|---|
| Route slug of the seventh view | `drawings` | Follows its label; the build plan's `geometry` referred to the wider geometry study, which this increment does not build |
| Native heading | h1 "Screen Configurator Workbench"; the configuration name, display number and draft version on the record line beneath it, published to the shell's record identity | The board's heading names the module; the shell's record pattern needs the record identity visible and in the browser title |
| Drawing-only inputs | Remembered in the browser beside the draft (local storage, per workspace, actor and configuration), never written to the proposal or the run | Profile, pitch, gutter, roof width, vent, roll width, direction and fabric reference have no quantity consumer (D14). The decision says server-side persistence needs separate authority; the proposal contract is unchanged |
| Roof profile list | The five-option profile control writes the r03 `roof` input when Gable, Arch or Venlo is chosen; Gothic and Sawtooth stay drawing-only | Keeps the saved draft consistent with r03 while the recovered field list is untouched |

## 3. Adaptations from the board

Each is an application adaptation of the accepted composition, visible here for Dean's review. None changes a quantity, a decision rule or a saved record.

| ID | Adaptation | Why |
|---|---|---|
| A1 | Explicit Save draft and Review calculation action bar with a reason for the change | The board assumed autosave. ADR-0034's command model records a reason and a receipt for every write; the bar keeps those visible on every view and on phones |
| A2 | Send to estimate stays the working synthetic receiving flow (review, decisions, apply) | The board disables it "until definition approval"; the application's receiving flow is tested and its outputs are synthetic contributions, not issued estimates. Blocked while the roll is too narrow (DEC-R2) |
| A3 | Three-column compositions adapt to the module's own width | The shell's rail and docked secondary menu leave about 1,124 px at a 1,440 px viewport; the board drew 1,440 px of content. The sections list becomes a row and side panels narrow below 1,240 px, then stack below 900 px |
| A4 | Drawing labels are SVG text | The board used HTML overlays because of a runtime defect; SVG text keeps the downloaded sheets self-contained |
| A5 | Parts keeps a section filter beside the four segmented filters | Carried from r03; the board shows only the four |
| A6 | The phone bottom bar carries the save actions, not the standard-cloth readout | The readout stays in the live card above; the shared phone navigation bar occupies the bottom of the screen |
| A7 | Record line under the heading | See section 2 |

## 4. Verification

| Check | Result |
|---|---|
| Unit tests `tests/unit/specialist-workbench.test.ts` | Nine cases: the decision's r10 height checks (Venlo 4.6464 m and 4.8081 m, Gable 5.2929 m, Arch R 3.9554 m, Sawtooth 5.5957 m), curve symmetry and the Arch circle, every withholding rule, roll fit, remembered-input sanitising, sheet geometry from the engine's facts, cut schedule and coverage cross-check, readiness gates, priced extensions |
| Existing engine, validation and HTTP suites | Unchanged; `definition.ts` adds the view slug only |
| Browser spec `tests/browser/specialist-workbench.spec.ts` | Rewritten for the board's controls: seven views, every roof profile drawn by the shared component, a drawing-only error withholding the section and not the quantities, field selection across sheets, the working panel, segmented receiving decisions, recovery and permission withdrawal. Local execution against the task dev server is recorded in the pull request |
| Type check and lint | Pass on the worktree |
| Local captures | 1,440 px with the menu docked and collapsed, 390 px phone; retained in `docs/reference/ui/specialist/workbench-native-r01/` |

Not verified: owner visual acceptance, screen reader and 200% zoom, A3 print output on paper, the hosted demo, real devices.

## 5. Open for Dean

1. Confirm the slug `drawings` and the heading settled in section 2.
2. Whether drawing-only inputs should be saved with the run. That is a proposal schema change and a migration under the decision's separate authority; until then they are remembered per browser.
3. Whether Send to estimate should be gated as the board shows (A2).
4. Promotion to the accepted UI baseline register needs paired captures accepted at the agreed viewports; this record does not update `docs/standards/ui-baselines.json`.
