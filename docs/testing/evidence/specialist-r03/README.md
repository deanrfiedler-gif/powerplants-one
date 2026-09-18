# Screen Systems r03 verification

This record covers the r03 successor to the r02 workbench. It keeps separate: source inspection, model execution, browser execution, visual review, and business acceptance. The [changelog](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Changelog-r03.md) lists the changes and the source conflicts.

## Source inspection

The secondary source is the private screen-estimator analysis workbook r04, SHA-256 `de427bd99369bae35df6e29b6d9ffd9d340aa7d3a886c52698d76cc275e69c4a`. It was read without modification.

- **What was extracted.** `scripts/extract-specialist-r03-catalogue.py` reads the WEB_APP_SPEC, TEST_CASES and OPTION_SETS sheets. It writes `docs/design/specialist/r03/catalogue.js`, SHA-256 `bf3df55264fccc846905e29b2806842b5f21d9593f27b912d4cf9484af2a2dbe`, and rerunning it reproduces those bytes.
- **What the extract contains.**
  - 101 part numbers, with no prices.
  - 143 reviewed position rules, which reach 83 of the 101 parts.
  - 12 parameters.
  - Coverage for 142 fields, 77 varying and 65 constant. Values for 21 commercial fields are withheld.
  - 21 untested options.
  - 12 source discrepancies.
- **Confidentiality.** The extractor refuses output that contains a quote identifier or a price field. The workbook itself is not committed.
- **What the part rules are.** The rules were derived by hand from the recovered description formulas, `TABLES!J1:K37` (including the `C102`-dependent expressions at K2, K3, K4 and J10 and the couplings at M10:M11), `TABLES!C18:E26` and the EdgeHooks table. They are a provisional design-time mapping for catalogue owner review, not an approved catalogue.

## Model execution

`node scripts/check-specialist-r03-model.mjs` passed **41 groups** ([model-results.json](model-results.json)):

- **The 26 r02 groups**, run against the r03 model.
- **Exact cloth lookup:** six rows exact, including 5 → 5.3, with unsupported bays still withheld.
- **Parity with r02:** a row-by-row run of the unchanged r02 model against r03 at default parameters in 28 scenarios. It compares quantities, statuses, geometry, torque, commercial bridge, manual-review flags and warning identities.
- **Catalogue integrity**, including no prices and no quote identifiers.
- **Drive-family part resolution**, with stored diameters and location left unchanged.
- **Separate identities** for Pinion tube diameter, drive pipe diameter and cable location.
- **Drive pipe diameter** applies the recovered `C102` rules: Cable drums double above 25 NB (`TABLES!K3`), drive protectors follow, sprockets are two per included motor at 50 NB (`C297`), and the drum, bearing, coupling and pipe parts follow their tables. Pinion quantities are unchanged by the diameter.
- **Truss chord height** selects the truss clip part without changing any quantity; five values have no historical example.
- **Roof profile** has no source cell and no quantity effect.
- **Conflicts and unresolved dependencies** are never silently mapped.
- **Saved lines** store part numbers only and resolve their descriptions when shown; restore rejects altered identity.
- **Untested selections** are counted and non-blocking.
- **Parameters:**
  - The eight bound parameters recalculate their consumers.
  - The four recorded-only parameters change nothing.
  - The Cable first-band torque result is a parameter.
  - A parameter change needs a reason, respects write gates, invalidates the manual quantity reviews and is recorded in the saved run.
  - Restore rejects an altered parameter.
- **Coverage counts and corrections.**

## Browser execution

`node scripts/check-specialist-r03-browser.mjs` passed **35 groups** with no console or page errors ([results.json](results.json)). The tested HTML has SHA-256 `3cc832c3368f5b7ac9eb3352eee0fc3525e5220984214eb6c459c6ae2fb79881`. Earlier passes: 29 groups on the first build (`3dbcb516…`), 32 on the second (`bf6377dd…`); the third pass added the cross section, bay section and drive-pipe groups.

**Runtime disclosure.** The design session ran with `PPO_BROWSER_CHANNEL=` (empty), Playwright 1.56 and bundled Chromium `141.0.7390.37`. It did not use the repository's pinned Node, Playwright or native Chrome channel. The workflow default remains `channel: 'chrome'`, and the pinned-runtime result must be read from the Screen Systems workflow run on the pull request.

**What the groups cover:**

- **All r02 browser groups**, adapted to r03.
- **Untested-option notice:**
  - The Pinion notice text is shown, and its computed fill and text colours match the attention style.
  - `aria-describedby` links the notice to its control.
  - The release count updates.
  - Selecting Cable clears the notice; selecting pipe diameter 32 shows one without blocking.
- **Diameter controls:** Pinion tube diameter, Cable location and drive pipe diameter are separate controls with the recovered option sets, and switching drive family leaves stored values unchanged.
- **PPO part column:** it is leftmost and searchable, and the working dialog shows both identifiers.
- **Saved runs:** they store part numbers without descriptions, and the saved-line menu resolves the description.
- **Coverage and catalogue views:** the coverage view renders, and the catalogue view lists 101 parts with no dollar amounts.
- **Parameter editing:**
  - A reason is required.
  - Drive spacing recalculates.
  - All 14 allowances are flagged for review.
  - The controls are disabled for a read-only reviewer.
- **Layout and input:**
  - All six views fit widths from 1440 to 320 px, with Definition review opened on coverage.
  - Arrow, Home and End keys move between views.
  - Phone controls are at least 44 px high.
- **Greenhouse plan:** the drawn footprint keeps the true width-to-length ratio; drive lines equal the calculated drive count; one motor per group across and along; wall-screen spans, the odd bay and the motors-along boundary appear only when configured.
- **Screen cut:** the toggle moves focus, sets `aria-pressed`, and the diagram terms follow the overhang input.
- **Cross section:** one roof path per span that changes with the roof profile; drive dots equal the drive lines; one strip per motor group with a fixing glyph at each end that changes with the edge fixing; the wall-screen extension appears when configured.
- **Bay section:** chord glyphs are squares or circles per truss shape and follow the chord height; crosswire dots equal supports × bays shown, or clips per chord with Truss Clip; leading-edge tubes or profiles per bay; the drive line is dashed for Cable; the open state redraws gathered cloth and moves focus.
- **Drive pipe activation through the UI:** enabling gate 263 and choosing 50 NB doubles the drum quantity, quadruples protectors, and shows the Ultra Groove drum part in the parts view.
- **Dates:** run history and snapshots show dd Month yyyy · HH:mm.
- **Storage:**
  - The export filename is r03.
  - The r03 storage key is isolated, and an existing r02 session value is left untouched.

## Visual review

Twelve captures were inspected at original scale across three passes ([visual-review.json](visual-review.json)). The first pass produced three layout refinements: balanced parts-table column widths, a renamed coverage header that rendered with a narrow space, and non-wrapping parameter buttons. The second pass audited the module for professional finish and redesigned the greenhouse plan: true-scale footprint, computed drive positions, motor groups both ways, wall-screen spans and odd bay, a screen-cut diagram, readable dates and a print layout. Seven plan configurations were captured and reviewed before the final run. The third pass added the cross section and bay section: seven section configurations were captured, the bay section's crowded screen-level stack was separated and its height compressed with break symbols, and the roof pitch and vertical exaggeration were softened. The checks were rerun after each pass, and the final results above belong to the final HTML. This was a design-session review, not owner or device acceptance.

## Reproduction

```sh
python3 scripts/build-specialist-r03.py
python3 scripts/build-specialist-r02.py   # must still match bc06fa41…
node scripts/check-specialist-r03-model.mjs
node scripts/check-specialist-r03-browser.mjs
```

Still open: native Chrome execution in CI, owner visual acceptance, catalogue owner review of the part rules and descriptions, engineering acceptance, and catalogue confirmation of the drum, bearing and coupling descriptions the `C102` rules now select. EA-16/17, AT-04/28, G06 and production approval are not closed by these results.
