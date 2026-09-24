# Priva fertigation workbench refinement — proposed design departures

**Status:** Direction given; implementation in progress. On 23 September 2026 Dean directed that the improvements be applied (see [Direction and implementation](#direction-and-implementation-23-september-2026)). D1 and D7, features F2–F7 and F9, and F1's placement ([ADR-0044](ADR-0044-fertigation-held-import-placement.md)) and declarations are implemented; the rest remain proposed. Visual review, owner acceptance of the running screens and CI are separate and not yet recorded.
**Owner:** Dean Fiedler.
**Raised:** 23 September 2026, from a design review of the r02 standalone workbench. Extended the same day by an audit of the board against the native module.
**Covers:** Priva fertigation scoping workbench r02, the standalone HTML whose SHA-256 is `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9` (the same bytes [ADR-0038](ADR-0038-priva-fertigation-native.md) records, retained at `reference/ui/priva-fertigation-scoping-workbench-r02.html`); the ES-02 fertigation scope; and the native record route `route:/estimating/fertigation/[id]` ([page contract](../design/development/pages/route-estimating-fertigation-id.md)).

## Question

Which presentation changes and features on the refinement board should become the fertigation workbench baseline, and on what conditions?

## Context

- Dean asked for a design board of the r02 workbench with refinements that make it look more professional, then directed that the work proceed however is most professional. He then asked for an audit of that version, to make the module a standout module in Powerplants One.
- The board is a private claude.ai design canvas, "Priva Fertigation Workbench" (version 8, 23 September 2026). It holds 21 artboards in five rows plus shared parts:
  - the nine sections at 1440 px;
  - an import reconciliation page;
  - two drawers: resolve a conflict, and a calculation trace;
  - revision compare;
  - a customer report on two A4 pages;
  - the Overview and a site-visit capture flow at 390 px;
  - a state sheet and a design-language sheet;
  - the shared module header and section rail.
- The board uses r02's synthetic project. Since version 6 it presents it in native terms: reference `SYN-PPO-FRT-000001`, revision 1, bound to Discovery alternative B, calculation edition `PPO-FERT-NATIVE-CALC-r01`. It changes no native calculation. Values the native engine does not compute are labelled **Proposed calculation** or **Proposed analysis** on the board.
- Observed in r02 at desktop width:
  - text inside the SVG charts and diagrams scales with the window, to about 30 px on Dean's 1920 px screenshots;
  - axis ticks fall on non-round steps (11.6, 23.3, 34.8);
  - the five header actions wrap to a second row;
  - the nine tabs show a count only on Scope review;
  - the five configurator cards repeat identical warnings;
  - missing values read "Unknown bar" or "Unknown m³/h".

Known: the r02 bytes, its sample data, the native source at this branch's head and the board's content. Assumed: the native route keeps its nine views and ADR-0038 registers. Not verified: see Verification.

## Proposed departures

Each departure can be accepted or rejected on its own.

| ID | r02 or native today | Board | Standard it touches | Recommendation |
|---|---|---|---|---|
| D1 | r02: horizontal strip of nine tabs, scrolling sideways below 1180 px. Native: already a left secondary menu (`SecondaryMenuFrame`) with the nine views, ungrouped and without counts | 248 px section rail using the native view labels, grouped Define the farm · Test the operating basis · Prepare the scope, with a severity count per section and an icon as well as colour. A section picker on phones | [Conformance](../standards/html-module-conformance.md): the shell owns application navigation. Precedent: the accepted Job Pack contents rail ([Job Pack design](job-pack-design.md)) | In the application, keep the native secondary menu and add the grouping and per-section counts. In the standalone module, replace the tabs. *Corrected 23 September 2026: the first version of this record treated the rail as a departure from native as well.* |
| D2 | Masthead with five actions wrapping to two rows; full-width synthetic-data banner | Record workspace header: scope name and reference, "Saved revision 1", History, Report and one primary action, Save revision. Context row with Discovery binding and source state, stage, scenario and a synthetic tag | Conformance: no competing application masthead | Adopt. In the application the shell owns branding; the module keeps its title and context row |
| D3 | Chart fills #8896a8 (prepare) and #83b6d3 (flush, 2.19:1 against white) | Keep #8896a8 (3.01:1); darken flush to #5b9bc0 (3.05:1); add #c4553f conflict share (4.45:1) and #c4851a incomplete share (3.13:1) | [UI style specification](../standards/ui-style-specification.md) palette; WCAG 1.4.11 non-text contrast | Adopt as chart-only fills, not as status tokens |
| D4 | "Unknown bar" and "Unknown m³/h" text; C1 reads Unknown in the base scenario | Dashed "Not recorded" or "To confirm" token; "Excluded in scenario" for a phase-excluded value, with its value when included; a basis tag (Assumed or Calculated) on each metric tile | ADR-0038 result states: known, unknown, not applicable, outside the supported model | Adopt, mapping one visual treatment to each ADR-0038 state |
| D5 | Five configurator cards, each repeating "Outside entered limits" and "Envelope unverified" | One comparison table: each family's published envelope drawn against the 16–28 m³/h requirement, an indicative read per family, and the shared project check stated once | ADR-0038: no manufacturer rating is seeded; user-entered failures remain failures | Adopt on two conditions: per-row project status returns as soon as any family has an exact configuration, and the indicative read stays labelled indicative, never a rating |
| D6 | Charts and diagrams as scaled SVG | Fixed 11–14 px chart text; round axis steps; labelled readouts (curve head 45.4 m, required 39.4 m, margin +6.0 m); head build-up bars; a single-cycle timeline detail; channel-by-channel I/O banks; scope review grouped by section with identical checks combined | None; presentation only | Adopt |
| D7 | r02: 2 blockers and 19 review checks. Native: finding severities incomplete, conflict and review, with no responsible role | r02's 21 checks shown with native severities (2 conflict, 14 incomplete, 5 review) and a default responsible role on each: Priva specialist 12, Irrigation designer 3, Agronomist 2, Grower 2, Scope author 2 | ADR-0038 finding severities | Adopt the native vocabulary everywhere, including the standalone module. The role default is registry data keyed by finding code, overridable per check (F6) |

The board displays values that r02 computes but does not show:

- the head build-up: 20.4 + 6 + 5 + 4 + 4 = 39.4 m;
- the emitter derivation: 4,000 × 2 × 2 L/h = 16.0 m³/h;
- "8,000 of 8,000 containers allocated", from r02's duplicate-allocation check;
- C1 at 2 m³/h and G3 at 100 L per event, from the future scenario;
- the pipe transit: 196.35 L, 70.7 s.

The indicative family reads ("Spans required range", "Peak above published 25", "Below published statements") are new interpretive labels over r02's published family statements.

## Audit findings, 23 September 2026

The audit read the native module at this branch's head and ran r02's own sample project through the native importer and engine (`previewImport`, then `calculate`). Findings are ranked by consequence.

| ID | Finding | Evidence | Disposition |
|---|---|---|---|
| A1 | **Defect.** Native import rejected every file r02's own "Download project" writes. r02's `exportProject` adds `exported_at` and `export_scope`; the strict top-level contract refused both, so a genuine r02 download could not even be previewed. The FN-T40 fixtures are built from the contract, so no test saw the keys r02 actually writes | `src/estimating/fertigation/legacy-validation.ts`; r02 source contains `portable.exported_at=now();portable.export_scope=` | Fixed in `45ac18e`. Both keys are accepted as bounded text and surfaced as source provenance only; any other unknown key is still rejected. New FN-T40 test pinned to the issued r02 bytes |
| A2 | **Defect.** "Export exact saved scope" omitted the required `format` parameter, so the export route answered 422 | `src/components/fertigation-workbench.tsx` | Fixed in `45ac18e`. The link requests `format=json`; a new "Export valve CSV" link exposes the existing `valves` format |
| A3 | **Gap; placement built under [ADR-0044](ADR-0044-fertigation-held-import-placement.md).** After A1, the r02 sample previews but is **held**: 80 populated legacy fields across 21 record families have no native mapping. Confirm is disabled and the screen offers no way to resolve them, so the exemplar r02 project cannot reach a native draft | `interchange.ts` refuses a held preview ("Resolve every listed mapping before creating a native revision"); `fertigation-import.tsx` disables Confirm while held | F1. Held fields are now placed explicitly before confirmation (FN-T109–FN-T112) |
| A4 | **Gap; declarations built.** Once imported (now possible, A3), the draft opens with 28 findings (21 incomplete, 7 review). They reduce to 12 declarations. Building them showed that undeclared phases are the root cause of 11 findings, including every density, valve-flow and timing finding; the offered edits clear 16 of the 28; binding the supply source then raises the engine's own storage-overflow review, and the 12 that remain need new information (FN-T113–FN-T116) | Native engine output for the r02 sample | F1 |
| A5 | **Gap.** The customer report lists findings as codes ("io deficit — 1 recorded finding"). Exact identifiers and hashes lead page 1, and the PDF footer is 8 px (about 6 pt) | `output.ts`, `render.ts` | F7 |
| A6 | **Gap.** A result's reason is available, but not how it was reached. The native pump margin is unknown unless the loss-flow basis equals the pump duty; nothing on screen shows this rule or the inputs behind 39.4 m | `engine.ts` hydraulic results; `dependencies` is empty in current output | F3 |
| A7 | **Gap.** A conflict can be seen but not worked. There is no way to compare resolutions before editing | Workbench views | F2 |
| A8 | **Gap.** Native history compares input paths between two saved revisions. It cannot compare a working draft, and it shows no result or finding changes | `history.ts` difference walk over `proposal` and `binding` | F9 |
| A9 | **Gap.** A blank save reason becomes "Save reviewed scope changes", so revision history carries no real reason | `fertigation-workbench.tsx` `save()` | F9 condition |

## Proposed features

Each feature is proposed, not accepted. "Edition change" means a new calculation edition beyond `PPO-FERT-NATIVE-CALC-r01` would be needed before the value is retained in a revision or an output.

| ID | Feature | Board | Rule basis | Edition change | Scope of work |
|---|---|---|---|---|---|
| F1 | Import placement and declarations: every held legacy field is placed explicitly (covered by Discovery binding, kept as a verbatim source note, evidence for a declaration, or mapped to a native field), then r02 values are offered, never applied silently, for the 12 declarations | 10 · Import an r02 project | Explicit disposition per field keeps ADR-0038's "held, not silently truncated" | No | Import contract and confirm payload; ADR before build, because it changes held-import policy |
| F2 | Resolve a conflict: options per finding code from a resolution register, with consequences computed by running the existing preview on each candidate proposal | Drawer · Resolve a conflict | Deterministic recalculation; option B's threshold (dose ≤ maximum ÷ group flow = 50 ÷ 28 = 1.78 L/m³) is arithmetic on recorded values | No for options A and C; yes if B's threshold is retained | Resolution register; preview on candidate proposals |
| F3 | Calculation trace: inputs, rule, weakest evidence and where-used for each result | Drawer · Calculation trace | Engine populates the existing `dependencies` field; values unchanged. Sensitivity and break-even (2.58 bar) are a proposed analysis | No for the trace; yes for sensitivity if retained | Engine provenance; drawer |
| F4 | Capacity headroom: every capacity limit on one 0–200% scale | 01 · Overview | Ratio of a native result to its entered capacity, from a register of constraint pairs | No | Register; Overview panel |
| F5 | Output readiness: what the scope can produce now, each output gated by named finding codes | 01 · Overview | Register mapping outputs to blocking codes; never a percentage score | No | Register; Overview panel |
| F6 | Next actions by role: conflicts first, then the checks that gate the most outputs; default responsible role per code | 01 · Overview, 09 · Scope review | D7 role register; F5 register | No | Registers; filters |
| F7 | Customer report layout: plain-language findings from a phrase register keyed by native code; native notice, boundaries and review line kept; document control moved to the end; 10 px footer. The customer allowlist is kept: no scope name, scenario label or other free text | Report · A4 pages 1 and 2 | Deterministic phrase lookup; unknown codes print the native code | No; needs template edition `PPO-FERT-NATIVE-REPORT-r02` | Template; retained r01 outputs stay as issued |
| F8 | Site-visit capture plan: captures planned from the weakest inputs in the sizing chain, recorded as evidence in the working draft | Phone · Site visit | Evidence status order: Measured, Documented, Customer advised, Assumed, Unknown | No | Phone flow; no offline claim is made |
| F9 | Revision compare: working draft or saved revision against a saved revision, with input, result and finding changes, including state changes. Save reason required | History · Compare revisions | Both sides recalculated under one stated edition | No | Extends `history.ts` output |
| F10 | Three further checks: scenario timing against a radiation-sum start, missing acid channel with no water analysis, excess head at the smallest group | 09 · Scope review, labelled Proposed and not counted | New finding rules | Yes | Engine rules and tests |
| F11 | First arrival through P-01 and Channel A stock endurance | 04 · Recipes & dosing, labelled Proposed calculation | Plug flow (volume ÷ flow); stock ÷ daily use | Yes | Engine results |
| F12 | Device-to-channel allocation: declared bank demand reconciled with recorded devices | 05 · Controls & I/O | Count of recorded devices per bank | No | Controls view |

Recommendation: take F1 first. It is the only item that currently stops real work: an r02 project cannot become a native draft. F2, F3 and F9 then turn the module from a register into a working tool. F7 is the one most visible to customers.

## Direction and implementation, 23 September 2026

Dean's direction, after reviewing the board: "I'd like you to apply all the improvements that you believe will make this module as advanced and professional as possible. I'm quite happy to spend a lot of work on this module, as it will be a core component of the Powerplants One app."

This is direction to build, not a visual review or acceptance of the running screens. Each item below is built in the native module; nothing changes a calculation or a finding.

| Item | Built as | Rule basis kept | Verified |
|---|---|---|---|
| D1, D7 | Grouped secondary menu with per-view severity badges and a readiness summary; native severities and a default responsible role per finding code | Badge hidden from the accessible name, announced by `aria-describedby`; role register keyed by all 60 engine codes | FN-T94–T98; compiled desktop/phone suite |
| F4 | Capacity headroom on the Overview | Each row compares a native result with its entered capacity using the engine's inequality; a bank whose declared and device-derived demand disagree reads Not assessable, as the engine withholds its spare count | FN-T99 |
| F5 | What this scope can produce now | The server's own preconditions for export, report, review and handover | FN-T101 |
| F6 | Next actions by role; Scope review grouped by resolving view with severity and role filters | Conflicts, then incomplete, then review; candidate failures listed with conflicts but never counted as findings | FN-T97, FN-T107 |
| F3 | Calculation trace drawer for required head, curve head, margin, operating peak and connected flow; pump-duty chart and duty table | The engine's value only; rule text mirrors the engine; curve heads use `interpolateCurve`. Sensitivity and break-even are not built (they would be new calculations) | FN-T89–T93 |
| F2 | Resolve a conflict drawer | Options restate the engine's pass condition. Draft edits exist only where unambiguous (split a group, align declared I/O demand, de-duplicate a valve), are previewed by the server and are applied to the working draft only | FN-T104–T107 |
| F9 | Result, finding and candidate changes in saved-revision comparison; Compare draft against the saved revision | Both sides are engine outputs; nothing is recalculated for the comparison | FN-T102, FN-T103, FN-T107 |
| F7 | Report template `PPO-FERT-NATIVE-REPORT-r02` and a 10 px PDF footer | Customer allowlist kept; phrases come from the guidance register; retained r01 outputs keep their bytes | FN-T108; FN-T45/T46 retained HTML locally; r02 PDF not run locally |
| F1, placement | Place held legacy fields on the import screen, under [ADR-0044](ADR-0044-fertigation-held-import-placement.md) | Two dispositions only: keep the verbatim value as an unverified source note on the record it describes (or a generated evidence reference), or, for project reference, customer and site only, leave it to the Discovery binding. Every held path must be placed and the placement reviewed; the server recomputes the preview and validates the placements; they are stored with the import | FN-T109–FN-T112 |
| F1, declarations | Declarations this draft needs (Overview) and a Make a declaration drawer; Declare on Next actions for missing inputs | Register D-01–D-12 keyed by finding code. Each restates the engine's precondition, lists what the draft records and diagnoses what a finding waits on (for example "A1: flow waits on the phase of A · Mature blueberry pots"). An edit is offered only on a stated basis: *from recorded values* (a crop group takes its area's phase; a group the phase all its valves share; a scenario binds to the one source its valves draw from) or *your declaration* (a mixed group takes its latest valve phase; scenarios Proposed; single-pass drip, filling only unknown fields; a filter path). Controller, bank, control-ownership, I/O and strategy declarations offer no edit. Each edit is previewed by the server and applied to the working draft only; no ADR was needed because no import, engine or save rule changes | FN-T113–FN-T116 |
| Evidence coverage | Overview panel | Each active record counted once by its strongest linked evidence (document, observation, assumption, none) | FN-T100 |

Not built yet: F1's "evidence for a declaration" and "mapped to a native field" placements (declarations use values already in the draft; held r02 values stay in notes), F8 (site-visit capture), F10 and F11 (new calculations need a new calculation edition), F12, and A9 (a required save reason would change three existing save journeys).

Corrections found while building, now reflected here and to be reflected on the board:

- Native records a technical review with open findings (disposition "Reviewed; unresolved"), and a handover needs only a review of the exact revision. The board's "review unavailable while conflicts are open" was a design assumption, not native behaviour; the running screen shows the native rule.
- An injection channel above its entered range is a candidate failure in native, not a scope finding. It appears in Next actions and Resolve alongside conflicts but is never added to finding counts.
- The engine gates timing on the scenario's phase and I/O on bank and controller phases, but raises a phase finding only for areas, crop groups, valves, masters, sources and scheduled groups. An undeclared scenario phase shows only as "timing incomplete". The declarations diagnose this and name the phase; the engine is unchanged, and adding the missing findings would need a new calculation edition.

## Not changed

- Native calculations, registers, fields and severities. The board's 21 checks are r02's, presented with native severities (D7).
- Brand tokens, Roboto/Verdana, radii, 40 px desktop and 44 px phone controls, and the focus ring.
- Accepted baselines and the application, apart from the two defect fixes in `45ac18e`. Notices on the board use an even border without a left rule, consistent with option B of the [notice accent rule](notice-accent-rule-departure.md) proposal; that decision stays separate.

## If accepted

1. Record acceptance per departure and feature here, with the date and Dean's words.
2. Standalone module: issue r03 as a successor HTML with a change record, retaining the r02 bytes above.
3. Native route: record the accepted revision, viewport and hash under Visual references in the page contract; build with shared components; review paired captures at 1440 × 960, 1024 × 768, 390 × 844 and 320 px.
4. D3: add the chart fills to the UI style specification as chart-only values.
5. D1 in the application: add the grouping and counts to the fertigation secondary menu and record the consumer in the component catalogue.
6. F1: done for placement ([ADR-0044](ADR-0044-fertigation-held-import-placement.md), raised before the code) and declarations. Per-family native mappings need their own rule and test each.
7. Features marked "Edition change": issue a new calculation edition with tests; retained revisions and outputs keep their original edition.

If a departure or feature is rejected, the board reverts that part and this record notes it as rejected.

## Verification, 23 September 2026

- **Board rendering.** The board was rendered locally in Chromium (Playwright 1.56) with the repository's Roboto variable font. A harness inlines the shared parts and imported artboards. This approximates the canvas runtime; it is not the runtime.
  - All 21 artboards were measured: no horizontal overflow, each height fits its content, and neither drawer body nor either A4 page clips.
  - The published layout was read back from the canvas after version 6; one published artboard was compared byte for byte with the local file. Versions 7 and 8 changed only the trace drawer and the two report pages.
- **Found and fixed on the board before publishing:**
  - a rail border hidden by 1 px;
  - duplicated page-heading actions;
  - wrapping group labels;
  - the phone view clipped by 20 px;
  - a review-share fill (#e2a93b) at 2.11:1;
  - a quoted font stack that broke the report pages' style attribute;
  - a revision history that claimed a retained report the scope review did not have;
  - customer report pages that printed the scope name, scenario label and Discovery option label, which the native customer allowlist withholds.
- **Values checked against native.**
  - Required head (static lift plus losses plus outlet pressure × 100,000 ÷ (998.2 × 9.80665)) and linear curve interpolation match `engine.ts`.
  - The report's notice, operating-basis sentences, result set, boundaries and review line match `output.ts`; the footer wording matches `render.ts`.
  - State-sheet wording marked native was copied from the workbench, import and shared request code.
- **Code (`45ac18e`).** Typecheck, eslint on changed files and the unit suite (354 of 354) passed on Node 22 with `npm ci --engine-strict=false`; the repository pins Node 24.21.0. Browser and database suites were not run.
- **Not verified:** rendering in the canvas runtime itself, 320 px width, 200% zoom, keyboard order, screen reader, forced colours and print from the canvas.
- **Pre-existing and unchanged:** brand green #62bb46 is 2.41:1 against white. r02 uses it for delivery bars; the board keeps it and adds a #416d33 outline where a cell carries meaning.

## Related

- Board: private claude.ai design canvas "Priva Fertigation Workbench".
- [ADR-0038](ADR-0038-priva-fertigation-native.md), [page contract](../design/development/pages/route-estimating-fertigation-id.md), [HTML module conformance](../standards/html-module-conformance.md).
