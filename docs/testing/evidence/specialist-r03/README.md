# Screen Systems r03 verification

This record covers the r03 successor to the r02 workbench. It keeps separate: source inspection, model execution, browser execution, visual review, and business acceptance. The [changelog](../../../reference/ui/specialist/PPO-Specialist-Configuration-Workbench-Changelog-r03.md) lists the changes and the source conflicts.

## Source inspection

The secondary source is the private screen-estimator analysis workbook r04, SHA-256 `de427bd99369bae35df6e29b6d9ffd9d340aa7d3a886c52698d76cc275e69c4a`. It was read without modification.

- **What was extracted.** `scripts/extract-specialist-r03-catalogue.py` reads the WEB_APP_SPEC, TEST_CASES and OPTION_SETS sheets. It writes `docs/design/specialist/r03/catalogue.js`, SHA-256 `650c11cafe1f29ceea70f44e27d4bbd6e913f68c8e1b185eee7d9b120aa96e7c`, and rerunning it reproduces those bytes.
- **What the extract contains.**
  - 101 part numbers, with no prices.
  - 143 reviewed position rules, which reach 80 of the 101 parts.
  - 12 parameters.
  - Coverage for 142 fields, 77 varying and 65 constant. Values for 21 commercial fields are withheld.
  - 20 untested options.
  - 9 source discrepancies.
- **Confidentiality.** The extractor refuses output that contains a quote identifier or a price field. The workbook itself is not committed.
- **What the part rules are.** The rules were derived by hand from the recovered description formulas, `TABLES!J1:K37`, `TABLES!C18:E26` and the EdgeHooks table. They are a provisional design-time mapping for catalogue owner review, not an approved catalogue.

## Model execution

`node scripts/check-specialist-r03-model.mjs` passed **39 groups** ([model-results.json](model-results.json)):

- **The 26 r02 groups**, run against the r03 model.
- **Exact cloth lookup:** six rows exact, including 5 → 5.3, with unsupported bays still withheld.
- **Parity with r02:** a row-by-row run of the unchanged r02 model against r03 at default parameters in 28 scenarios. It compares quantities, statuses, geometry, torque, commercial bridge, manual-review flags and warning identities.
- **Catalogue integrity**, including no prices and no quote identifiers.
- **Drive-family part resolution**, with stored diameters and location left unchanged.
- **Separate identities** for Pinion tube diameter, drive pipe diameter and cable location.
- **Pipe diameter** changes part identity only, never quantities.
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

`node scripts/check-specialist-r03-browser.mjs` passed **32 groups** with no console or page errors ([results.json](results.json)). The tested HTML has SHA-256 `bf6377dd99f554505c1bb65ab68b4d03424c3c4d6f26821210ef027614e19a46`. An earlier pass on the first r03 build (`3dbcb516…`) passed 29 groups; the second pass added the plan, screen-cut and date groups after the plan redesign.

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
- **Dates:** run history and snapshots show dd Month yyyy · HH:mm.
- **Storage:**
  - The export filename is r03.
  - The r03 storage key is isolated, and an existing r02 session value is left untouched.

## Visual review

Ten captures were inspected at original scale across two passes ([visual-review.json](visual-review.json)). The first pass produced three layout refinements: balanced parts-table column widths, a renamed coverage header that rendered with a narrow space, and non-wrapping parameter buttons. The second pass audited the module for professional finish and redesigned the greenhouse plan: true-scale footprint, computed drive positions, motor groups both ways, wall-screen spans and odd bay, a screen-cut diagram, readable dates and a print layout. Seven plan configurations were captured and reviewed before the final run. The checks were rerun after each pass, and the final results above belong to the final HTML. This was a design-session review, not owner or device acceptance.

## Reproduction

```sh
python3 scripts/build-specialist-r03.py
python3 scripts/build-specialist-r02.py   # must still match bc06fa41…
node scripts/check-specialist-r03-model.mjs
node scripts/check-specialist-r03-browser.mjs
```

Still open: native Chrome execution in CI, owner visual acceptance, catalogue owner review of the part rules and descriptions, engineering acceptance, and a decision on activating the `C102` quantity consumers. EA-16/17, AT-04/28, G06 and production approval are not closed by these results.
