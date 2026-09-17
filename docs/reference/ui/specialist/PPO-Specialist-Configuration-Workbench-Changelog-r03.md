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
| 3. Pinion tube diameter | Resolved with the owner as two identities, set out in the conflicts table below. **Pinion tube diameter** stays `C99`, 27 \| 32. The new **Drive pipe diameter** is `C102`, 25 \| 32 \| 50 NB, default 25, for both drive families. Switching drive family changes neither value. Pipe diameter selects the part number at positions 275 and 297; recovered quantities are unchanged. |
| 4. Untested options | **Inline notice.** Selecting an option that no historical quote exercises shows a non-blocking notice using the attention style (fill `#FDF0DB`, text `#8A5A12`): "No historical quote exercises this option — result is unvalidated." The Pinion notice also names CE-LINE-271, 273 and 274, whose r04 drive-table quantities are `#N/A`.<br><br>**Summary count.** The release-status cell shows how many untested selections are active, and an `UNTESTED` source notice is added to the working warnings. |
| 5. Coverage view | Definition review adds a **Historical coverage** view. It lists the 20 untested options (19 from §15 plus one correction) and the observed values and never-selected options for all 142 compared fields. For the 21 commercial fields, only the count of distinct values is shown. |
| 6. Tunable parameters | **Editable records.** Definition review adds **Tunable parameters**: 12 records, each edited with a reason and audit entry. Parameters are stored in the session, the signature and every saved run.<br><br>**Eight bound parameters.** These recalculate their consumers and mark the 14 manual quantities for review: `odd_bay_default_m`, `end_beam_divisor`, `baling_twine_factor`, `ls_wire_spacing_m`, `cable_size_band_1`, `drive_span_deduction_m`, `delay_unit_interval_m` and `crosswire_clip_spare`.<br><br>**Four recorded only.** Each has its stated reason: `crosswire_waste_factor`, `cloth_markup_divisor`, `cloth_fx_uplift` and `drum_spare_factor`.<br><br>**Default equivalence.** At default values, all quantities, totals, geometry and torque equal r02 in 28 scenarios. |
| Also | **PPO part catalogue view.** Lists the 101 part numbers, with no prices.<br><br>**Source manifest.** Now lists the secondary source.<br><br>**Session and export.** r03 uses its own local-storage key (`ppo-specialist-screen-r03`) and export filename, leaving r01 and r02 sessions untouched. |

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
  - The `C102` quantity consumers (`C263` drums per drive and `C297` sprockets) are not activated.
- **Other controls.** No manufacturer-approved range is claimed, and no control was added for kit, slip clutches, seal colour, greenhouse type or cloth family.
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

These discrepancies are listed as WAS-01 to WAS-09 in the coverage view. They are recorded, not resolved.

## Verification

Verification of HTML SHA-256 `3dbcb516b5eeba5d677c7dc64adc0539250885cf32120d2f2a830ebdedeb6008` is recorded in the [r03 evidence record](../../../testing/evidence/specialist-r03/README.md). It covers 39 model groups and 29 browser groups on bundled Chromium 141. The rebuilt r02 still matches its issued hash. Native Chrome execution through the repository workflow, owner visual acceptance, catalogue owner review of the part rules and engineering acceptance remain open.
