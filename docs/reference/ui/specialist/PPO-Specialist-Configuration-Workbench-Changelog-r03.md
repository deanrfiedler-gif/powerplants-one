---
document_id: PPO-ES08-WORKSPACE-CHG-R03
revision: r03
date: 2026-09-17
owner: Dean Fiedler
status: Proposed design successor; engineering, catalogue and operational acceptance open
base: PPO-Specialist-Configuration-Workbench-r02.html (SHA-256 bc06fa41f1362145eb585431427ee5aebe94d1e3c8a40cc53b68ccc4d6a72e5c)
---

# Specialist Configuration Workbench r03 changelog

[Open the r03 HTML](PPO-Specialist-Configuration-Workbench-r03.html). The [r02 report](PPO-Specialist-Configuration-Workbench-Report-r02.md) remains the authoritative design description; this changelog records only what r03 changes. r01 and r02 files are unchanged.

## Sources and authority

The r02 report and its normalised workbook remain primary. The second source is the WEB_APP_SPEC sheet of the supplied screen-estimator analysis workbook r04. This workbook is private, and its SHA-256 is `de427bd99369bae35df6e29b6d9ffd9d340aa7d3a886c52698d76cc275e69c4a`. r03 treats it as a secondary, partial source. Its TEST_CASES and OPTION_SETS sheets were used to check WEB_APP_SPEC against its own data. The public HTML embeds no catalogue prices, historical commercial values or quote identifiers.

## What changed

| Requirement | r03 behaviour |
|---|---|
| 1. PPO part identity | **Part column.** The Parts & working table has a new leftmost **PPO part** column, ahead of the source position. Search covers the part number, catalogue description, part status, position label, rule ID and cell. `CE-LINE-<row>` keys are unchanged, and the working dialog shows both identifiers.<br><br>**Five outcomes per position.** Each of the 143 positions resolves, for the current inputs, to one of five outcomes: a part number, no part selected, a text outside the catalogue, an unresolved dependency or a source conflict. A reviewed rule table, derived from the recovered description formulas, decides the outcome. Nothing looks a part up by description at run time. |
| 1. Line storage | **Saved lines.** Saved run lines now store `ppoId` and `partState` and no description. The description is resolved when shown. Restore rejects a stored description, an unknown part number or an inconsistent part state.<br><br>**Prices stay with the run.** Illustrative prices stay in each saved run, because an immutable run must reproduce its own price bridge. |
| 2. Cloth width lookup | Already six exact rows in r02 (2, 2.13, 3, 4, 4.5, 5 → 5.3). Unchanged. New checks prove 5 → 5.3 and that 4.9, 5.1, 5.3, 2.1 and 6 still withhold the calculation. |
| 3. Pinion tube diameter | Resolved with the owner as two identities, set out in the conflicts table below. **Pinion tube diameter** stays `C99`, 27 \| 32. The new **Drive pipe diameter** is `C102`, 25 \| 32 \| 50 NB, default 25, for both drive families. Switching drive family changes neither value.<br><br>**`C102` rules activated (owner decision).** The recovered expressions now run: Cable drums are one per drive at 25 NB and two per drive otherwise (`TABLES!K3`; `G95` Ultra Groove is Yes for Cable by formula), drive protectors follow at two per drum (`C265`), and sprockets are two per included motor at 50 NB (`C297`). The drum, bearing, Pinion coupling and pipe parts follow `TABLES!K2`, `K4`, `J10`/`M10:M11` and `A275`. At 25 NB every quantity equals r02. |
| 4. Untested options | **Inline notice.** Selecting an option that no historical quote exercises shows a non-blocking notice using the attention style (fill `#FDF0DB`, text `#8A5A12`): "No historical quote exercises this option — result is unvalidated." The Pinion notice also names CE-LINE-271, 273 and 274, whose r04 drive-table quantities are `#N/A`.<br><br>**Summary count.** The release-status cell shows how many untested selections are active, and an `UNTESTED` source notice is added to the working warnings. |
| 5. Coverage view | Definition review adds a **Historical coverage** view. It lists the 21 untested options (19 from §15 plus two from the same workbook's data) and the observed values and never-selected options for all 142 compared fields. For the 21 commercial fields, only the count of distinct values is shown. |
| 6. Tunable parameters | **Editable records.** Definition review adds **Tunable parameters**: 12 records, each edited with a reason and audit entry. Parameters are stored in the session, the signature and every saved run.<br><br>**Eight bound parameters.** These recalculate their consumers and mark the 14 manual quantities for review: `odd_bay_default_m`, `end_beam_divisor`, `baling_twine_factor`, `ls_wire_spacing_m`, `cable_size_band_1`, `drive_span_deduction_m`, `delay_unit_interval_m` and `crosswire_clip_spare`.<br><br>**Four recorded only.** Each has its stated reason: `crosswire_waste_factor`, `cloth_markup_divisor`, `cloth_fx_uplift` and `drum_spare_factor`.<br><br>**Default equivalence.** At default values, all quantities, totals, geometry and torque equal r02 in 28 scenarios. |
| Sections | **Cross section.** Looking along the house: one roof per span from a new **Roof profile** input (Gable, Arch or Venlo; nominal pitch), posts and gutters, the screen at height to screen (`C31`), one screen strip per motor group at its cut length with the overhang and the selected edge fixing (hooks, weights or blackout) at each end, drive lines end-on at their spacing, motors per group, and the wall-screen extension when configured. Vertical scale is exaggerated at most twice and says so.<br><br>**Bay section.** Looking across the house at mid-span, two bays at a time: truss chords cut as squares or circles (`C30`) at their chord height (`G30`), the cloth with its lap over each truss, the leading-edge tube or profile (`C63`) at the closed edge, the drive line (dashed for Cable, solid push-pull for Pinion) with a coupling per bay, crosswire supports per bay or truss clips (`C43`/`C44`), the motor at the gable, and the odd bay. A Closed / Open toggle redraws the cloth gathered with its travel direction. The height below the screen is broken, and the dimension stays exact.<br><br>**What makes them accurate.** Two inputs were added: **Truss chord height** (`G30`, recovered list 20–60 mm, default 30), which also selects the truss clip part at position 247, and **Roof profile**, a drawing input with no source cell, because the source records none and greenhouse type is not used to infer it. Each caption names which elements come from inputs and which are conventions. |
| Greenhouse plan | **Redrawn to scale.** The footprint keeps its true width-to-length ratio instead of a fixed height. Drive lines are drawn at their computed positions (0.4 m in from each group edge, then the actual spacing), so the drawing matches the drive count and spacing in the working. Motor groups are shown across and along, with one motor symbol per group.<br><br>**Shows what the rules distinguish.** Extra wall-screen spans appear hatched beyond the physical width; the odd bay is banded at its parameter length; a legend appears only for what is configured. Each group has a hover title with its width, drive lines and spacing. Dense drawings thin gutters or trusses and say so.<br><br>**Screen cut diagram.** A Plan / Screen cut toggle shows one standard screen: coverage, shrinkage allowance, both overhangs and the rounding remainder to scale along the length, the bay length inside the cloth width, and each term of the cut length. It states that additional screens round before adding overhang. |
| Also | **PPO part catalogue view.** Lists the 101 part numbers, with no prices.<br><br>**Readable dates.** Run history, snapshots and the audit trail show dd Month yyyy · HH:mm; the ISO timestamp stays in the snapshot.<br><br>**Print layout.** A4 print rules hide navigation and controls and keep cards and rows together.<br><br>**Source manifest.** Now lists the secondary source.<br><br>**Session and export.** r03 uses its own local-storage key (`ppo-specialist-screen-r03`) and export filename, leaving r01 and r02 sessions untouched. |

## Deliberately unchanged

- **File and theme.** A single self-contained HTML with no framework, build-time dependency, runtime dependency or network call. The r20 theme is unchanged.
- **Views.** The six views are unchanged.
- **Review model.**
  - The immutable run model, the 14 manual quantity positions and the 6 inclusion gates are unchanged, and a geometry change still marks all 14 for review.
  - `operationalReady: false` and the disabled send action remain.
  - Unavailable and explicit zero stay distinct, a blank rate still makes the total unavailable, and the no-purchase flag still keeps the line priced.
  - The whole-dollar discount and the final upward $10 rounding are unchanged.
- **Recovered rules.**
  - The recovered quantity definition `SS-RECOVERED-QTY-r02` and all quantity expressions are unchanged, apart from the eight bound parameters, which keep r02's values by default.
  - No formula is inferred for the 14 manual quantities or for the r04 `C273` formula.
- **Other controls.** No manufacturer-approved range is claimed, and no control was added for kit, slip clutches, seal colour, greenhouse type or cloth family. Truss shape still selects nothing; it is drawn, not inferred into a roof.
- **Accessibility and layout.** Accessibility and responsive behaviour are retained. The new select controls reference their notices through `aria-describedby`.

## Conflicts and resolutions

| Conflict | Resolution |
|---|---|
| WEB_APP_SPEC §9 assigns 25 \| 32 \| 50 to `C99` Pinion tube diameter. | **Evidence for two fields:**<ul><li>The r02 register labels `C99` "Push Pull Tube diameter 27 / 32".</li><li>The legacy Pinion list is `TABLES!J40:J41` = 27, 32.</li><li>Row 293 tests `C99=27`.</li><li>25 \| 32 \| 50 is the validation list of `C102` "Drive Pipe Diameter", and TEST_CASES records 25 and 50 on Cable quotes.</li></ul>**Owner decision:** two separate identities. |
| §14–15 say drive pipe diameter was never populated and is Pinion-only. | Corrected from TEST_CASES. Only 32 lacks a historical example. |
| §1 and §7 list five cloth rows; §8 lists six. | r02's six rows retained. |
| §14 is a 16-field extract and omits the observed 15-bay value. | The coverage view uses all 142 TEST_CASES fields. |
| §15 states "21 of 29" but has 19 rows, and omits baling twine "No". | The 19 rows are kept; baling twine "No" is added with its own source label. |
| §2 lists Cable location as End \| Middle. | r02's Central \| End retained. |
| §4 asks for prices resolved at render time. | Descriptions resolve at render time. Saved runs keep their price snapshot (immutable run model, r02). Catalogue prices are not published. |
| The r04 drive table names different Pinion parts from r02 at positions 264, 266, 267 and 274. The Cable part at 267 also conflicts with r02's activation of positions 268–269. | Shown as **Conflict** with candidates; no part is selected. |
| Catalogue texts "Connector Endmm for rack" and "Table Clamp Endmm". | Mapped to positions 270 and 278, with a note that the r02 text reads 27 mm. |
| `cable_size_band_1` is labelled a 100 mm threshold. | Bound as the Nm result of the first Cable torque band, as the source expression uses it. |
| The r04 workbook has a formula at `C273`, where r02 has a manual quantity. | r02 wins, so `drum_spare_factor` is recorded only. |
| §1 lists truss chord height as 25 \| 30 \| 50. | The legacy validation at `G30` lists 20, 25, 30, 35, 40, 50 and 60. r03 offers the recovered list; only 30 and 50 have a clip in the catalogue. |
| The extract's Pinion descriptions were cached from a Cable quote. | Speed- and pipe-dependent Pinion descriptions (push-pull 1:1 versus 1:1.8, slide-weld couplings) differ from what a Pinion quote would show. r03 applies the recovered formulas and marks the missing descriptions as not in the catalogue. |
| `G95` Ultra Groove drum looks like an input. | It is `IF(drive = Cable, Yes, N/A)`, so the 2-inch drum rule always selects the Ultra Groove drum for Cable. The formula is applied; no control is shown. |

These discrepancies are listed as WAS-01 to WAS-12 in the coverage view. They are recorded, not resolved.

## Verification

Verification of HTML SHA-256 `3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881` is recorded in the [r03 evidence record](../../../testing/evidence/specialist-r03/README.md). It covers 41 model groups and 35 browser groups on bundled Chromium 141. The rebuilt r02 still matches its issued hash. Native Chrome execution through the repository workflow, owner visual acceptance, catalogue owner review of the part rules and engineering acceptance remain open.
