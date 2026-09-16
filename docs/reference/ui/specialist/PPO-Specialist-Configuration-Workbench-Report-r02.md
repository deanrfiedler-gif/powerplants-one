---
document_id: PPO-ES08-WORKSPACE-RPT-R02
revision: r02
date: 2026-09-16
owner: Dean Fiedler
status: Proposed source-informed standalone design; engineering and operational acceptance open
source_commit: 07eb34d5df5ea430c365da78e160cb6aa0b76f20
---

# Specialist Configuration Workbench

## Screen Systems audit and design report

The r02 workbench turns the initial workflow demonstration into a source-informed Screen Systems review tool. Estimators can change supported dimensions and selections, inspect live quantity calculations, trace an output to its original worksheet cell, review manual allowances, and compare a proposed rerun with the saved configuration. The design follows the supplied Powerplants One r20 theme board.

Open [the interactive r02 HTML](PPO-Specialist-Configuration-Workbench-r02.html). The [r01 HTML](PPO-Specialist-Configuration-Workbench-r01.html) and [r01 report](PPO-Specialist-Configuration-Workbench-Report-r01.md) remain unchanged as historical design references.

The new workbook provides executable source expressions and a historical example that were unavailable to r01. It also confirms that the surviving estimator is not an approved modern definition: final quantities have been overwritten, some scope switches bypass quantities, source units and catalogue records contain errors, and important alternative branches remain unaccepted. r02 exposes these distinctions in the normal review workflow. It does not infer missing formulas from a past quote.

The public design uses a fictional Northbank replacement study and authored prices. The historical customer, quote values, original workbook, Word report and raw private verification data are not embedded or committed. Source hashes, cell coordinates, sanitised rule metadata and aggregate audit results provide traceability.

## 1. Audit conclusions

### 1.1 What the supplied evidence establishes

The attached workbook contains twelve sheets: Summary, Inputs, Rules, Parts, Variants, Engine, Lookups, Catalogue, Reconciliation, Review, Source register and Guide. The normalized structure retains 3,106 original formulas: 2,576 from `CALC_ENGINE` and 530 from `TABLES`. This count describes the recovered source formulas, not every formula introduced by the normalized workbook.

The input register contains 478 entries: 340 editable entries or overrides and 138 calculated fields. Those 138 calculated fields are outputs for review; they should not become another 138 estimator questions. The parts register preserves 143 source output positions, including inactive lines. Fourteen final quantity cells contain manual values rather than formulas, and six line-inclusion cells contain separate manual exclusions.

The Word report provides a useful plain-English explanation of each family of inputs and every output position. It identifies suspected defects rather than presenting historical behaviour as current engineering policy. Its source section references an earlier normalized workbook revision, while the supplied workbook filename is r02 and several internal headings still say r01. The exact attachment hashes therefore identify this audit baseline.

### 1.2 Differences between the report and the saved workbook

The report states that all 143 historical lines reconciled and describes 15 previously executed response checks. Inspection of the attached r02 file finds **142 `Match` results and one `#VALUE!` result** in `Reconciliation!L7:L149`. The error is the inactive kit line at L7, whose comparison involves a blank selling-rate source. That is a reconciliation-formula problem; it must not be silently described as a newly observed 143-line pass.

All 3,106 formula-display cells in `Rules!G7:G3112` have saved `#NAME?` values. The formula text is stored with an `_xludf.FORMULATEXT` prefix. Active expressions and original formula text remain recoverable from the underlying XML and Rules column H. The displayed error does not by itself prove that every underlying calculation failed.

Saved error cells also remain in Engine, Lookups, Parts and Catalogue. Examples include the broken motor-power reference, invalid screen-list references, missing cost lookup keys and catalogue metadata errors. These were inspected without refreshing external files or modifying the uploaded sources. Native desktop Excel recalculation has not been performed in this audit.

### 1.3 New verification performed for r02

The new JavaScript quantity model was run privately using the supplied historical inputs and compared with the attached Engine quantity caches. **141 of 143 quantity positions match**, including inactive zero positions and explicitly retained manual quantities. The two differences are the quote-specific one-off material at row 320 and catalogue addition at row 328; those additions are outside the configured public example and remain empty in r02. This comparison does not claim 141 independent engineering rules or complete branch coverage.

Independent arithmetic also recomputed the historical material sum from saved nonzero quantities and selling rates, applied the source whole-dollar discount and final upward $10 rounding, and matched the supplied headline total. This is an independent check of the cached price bridge, not a fresh evaluation of the complete workbook in Excel.

Ten previously recorded changed-input scenarios supplied 13 numeric outputs that are implemented in the new model. These outputs matched on rerun: changed spans, shrinkage, individual screens, weighted edges, Cable torque band, profile strip length, wider-sheet offcuts, an additional screen, motor inclusion and a manual quantity of zero. Invalid 100% shrinkage was separately confirmed to withhold results with a clear input error. Formula-edit, catalogue-price-edit and complete scenario quote totals are not claimed as new end-to-end port checks.

The public synthetic model suite exercises independent calculations, thresholds, unavailable inputs, overrides, exclusions, price policy, rerun conflicts and recovery. Exact native browser evidence and verification source are maintained in [the r02 evidence record](../../../testing/evidence/specialist-r02/README.md).

### 1.4 Changes from r01

| Area | r01 reference | r02 refinement |
|---|---|---|
| Calculation | Two fixed authored A/B snapshots | Live recovered quantity rules within the declared review scope |
| Geometry | Guide-derived fields and eight fixed results | Physical versus calculation spans, exact bay lookup, cut sizes, drive spacing and schematic greenhouse plan |
| Source evidence | Missing executable definition pack | Supplied workbook/report hashes, original expressions, 478-field inventory and 26 findings |
| Parts | Small synthetic parts example | All 143 source positions, active/zero/manual/excluded views and calculation versus procurement units |
| Manual quantities | Illustrative result overrides | The actual 14 source positions with no surviving final formula, explicit blank/zero and review basis |
| Pricing | E1-style illustrative extensions | Separate illustration of recovered FX, gross margin, unrounded extensions, discount and final rounding |
| Rerun | Reference-case comparison | Live before/after comparison with retained manual edits, removals, immutable evidence and recovery |
| Acceptance | Formula evidence absent | Formula evidence received; engineering ranges, parts mapping and branch acceptance remain open |

## 2. Workspace structure

The module contains six connected views. Its fixed context identifies the estimate, option, draft revision, customer, facility and stable configuration. No click changes that scope silently.

| View | Included information and actions |
|---|---|
| Configure | Six input sections, explicit units and source cells, live validation, greenhouse plan, calculation working, changed-input study and named source warnings |
| Parts & working | Search by description, rule ID or cell; active/unresolved, all, manual and zero/excluded filters; source formulas; manual-quantity editing; six inclusion gates; explicit exclusions |
| Pricing | Active quantities, illustrative cost/sell rates, cost currency, no-purchase flag, missing-rate behaviour, recovered price bridge and receiving-policy explanation |
| Compare & save | Saved and proposed totals, stable-key changes, manual/removal decisions, allowance review, save acknowledgement and cancellation |
| Definition review | Source manifest, audit counts, 26 findings, reviewer notes, logical owners, complete input inventory and bounded calculation coverage |
| Run history | Immutable runs, complete JSON snapshots, saved-line adjustment, audit trail, export/restore, original receipt recovery, totals repair and receiving-module snapshots |

The four summary cells show physical floor area, standard cloth, outstanding manual quantity reviews and release status. These cells answer immediate working questions without turning the prototype into an approval score.

### Configure

A compact section rail organizes 61 primary controls into Greenhouse, Cloth & edges, Bed & wire, Drive & motors, Supports & tape, and Commercial. Five expandable additional-screen slots provide another 20 editable numeric controls. The fixture gives each slot a synthetic material reference; a live product/material selector and additional-screen pricing definition remain receiving work.

The centre panel holds the selected inputs. The side panel shows a responsive SVG greenhouse schematic and six selected calculation results. The plan updates physical dimensions and motor grouping; it is explicitly schematic and is not a structural drawing or motor-placement instruction. Large span and bay counts are visually capped to keep the drawing legible, while the numeric calculation uses the entered counts.

Changing an input recalculates the current preview. Typing does not rebuild the entire form, so focus and the next button click remain stable. Invalid inputs remain visible, with a field-specific explanation; results are withheld until the error is resolved. Section navigation remains available for inspecting the draft.

### Parts and working

Each row exposes its stable source position, description, group, calculation quantity, calculation unit and provenance. A working dialog shows the retained quantity rule and original formula text. The rows represent recovered source positions; their descriptions are not proof of a current selected SKU.

The public model leaves current legacy part IDs and MYOB inventory IDs unmapped. Metres of coated wire, rolls of LS wire, pieces, packs and stock lengths are kept distinct. The calculation unit describes what the expression produces. Procurement-unit conversion is a separate unresolved mapping, particularly for profile clips and catalogue descriptions that name a roll while the quantity is metres.

The complete register includes zero rows, rather than hiding evidence simply because the historical line was inactive. Source positions outside the limited configured example remain visible at zero and are listed in the coverage dialog. Enabling installation produces unavailable quantities instead of a fabricated zero allowance.

### Pricing

Rates use `SYN-PRICE-02`. They are authored examples and deliberately differ from the supplied quote. Unit cost can be AUD or EUR; unit sell is AUD. A blank rate means unavailable. Zero means an explicit zero rate and requires a recorded pricing reason. A no-purchase flag does not remove a line from the price.

The price bridge shows raw material extensions, whole-dollar material discount, enabled freight, subtotal before final rounding, upward $10 adjustment and the review total. An unresolved quantity or required rate makes the complete total unavailable; visible partial amounts are labelled accordingly. The source discount position is retained in the parts register, while the actual adjustment is calculated once in the bridge.

Sea freight uses entered cost divided by one minus gross margin. Local freight uses its explicit selling amount. The EUR-per-AUD rate converts EUR cost by division. Import duty, air freight, commission, kit pricing and installation charging are not configured by this bounded public example. Their source positions and audit requirements remain visible.

The existing E1 application money contract rounds line amounts separately. r02 deliberately exposes the recovered historical policy without modifying E1. The application integration needs an explicit, versioned decision about which policy applies. No tax treatment has been invented.

## 3. Input catalogue

Source cells below refer to the original `CALC_ENGINE` coordinates retained by Engine. Source dropdown choices are recovered choices, not approved engineering operating envelopes. Required positive denominators, whole counts, finite arithmetic, six-decimal input precision and preview size limits are implementation safeguards. They are not manufacturer capacity limits.

| Input | Display unit | Source cell | Choices or interpretation |
|---|---|---|---|
| Physical spans | count | `C24` | Numeric entry |
| Extra wall-screen spans | count | `G24` | Calculation width only; physical width stays unchanged. |
| Span width | m | `G25` | Numeric entry |
| Bays along length | count | `C26` | Numeric entry |
| Bay length | m | `G26` | Cloth width uses an exact lookup, never interpolation. |
| Extra-long bay | Selection | `C27` | No, Yes |
| Truss shape | Selection | `C30` | SQUARE, ROUND |
| Height to screen | m | `C31` | Recorded context; no surviving quantity consumer. |
| Overhang at each end | m | `C67` | Numeric entry |
| Shrinkage allowance | % | `G67` | UI percentage is normalised to a fraction before calculation. |
| Individual screens per span | Selection | `C68` | No, Yes |
| Include edge seals | Selection | `C69` | No, Yes |
| Cut from wider sheet | Selection | `C71` | No, Yes |
| Wider sheet width | m | `G71` | Numeric entry |
| Overhang fixing | Selection | `C73` | Hooks, Weights, Blackout |
| Edge clip spacing | m | `G73` | Numeric entry |
| Leading edge | Selection | `C63` | Tube - Alum, Tube - Steel, Profile |
| Bed fastening | Selection | `C43` | Crosswire, Truss Clip |
| Crosswire supports per bay | count | `C44` | Numeric entry |
| Strainers per crosswire | count | `C47` | Numeric entry |
| Replace LS wire | Selection | `C59` | No, Yes |
| LS wire roll length | m/roll | `G58` | Numeric entry |
| LS wire spare allowance | % | `G211` | Source stores percentage points. This is not a global parts allowance. |
| Baling twine | Selection | `G53` | No, Yes |
| Oval edge-wire clamps | Selection | `C55` | No, Yes |
| Crosswire clips | Selection | `C56` | No, Yes |
| Crosswire clip spacing | m | `G56` | Numeric entry |
| Edge-wire plates | Selection | `C52` | No, Yes |
| Omega strips for edge wires | Selection | `G59` | No, Yes |
| Drive family | Selection | `C95` | Pinion, Cable |
| Pinion tube diameter | mm | `C99` | 27, 32 |
| Cable drive location | Selection | `C99` | Central, End |
| Motor groups across | count | `C88` | Numeric entry |
| Motor groups along | count | `C89` | Numeric entry |
| Target drive spacing | m | `C97` | Numeric entry |
| Central-drive droppers | Selection | `C103` | No, Yes |
| Droppers per calculation span | count | `C104` | Numeric entry |
| Droppers per 8 m stock | count | `G103` | Numeric entry |
| Strainers per dropper | count | `C105` | Numeric entry |
| Wire per dropper | m | `G105` | Numeric entry |
| Delay units | Selection | `C108` | No, Yes |
| Wall pulleys | Selection | `G108` | No, Yes |
| Supply motors and switchgear | Selection | `E295` | No, Yes |
| Supply end beams | Selection | `C37` | No, Yes |
| End braces | Selection | `C40` | No, Yes |
| Brace length | m | `C41` | Numeric entry |
| Support chain | Selection | `C42` | No, Yes |
| Chain per span | m | `G42` | Numeric entry |
| Internal omega brackets per span | count | `C39` | Numeric entry |
| External omega brackets per span | count | `G39` | Numeric entry |
| Extra LS-wire fixing screws | Selection | `G38` | No, Yes |
| Double-sided tape | Selection | `C75` | No, Yes |
| Tape rolls of 50 m | count | `G75` | Numeric entry |
| Quoted exchange rate | EUR/AUD | `C211` | Synthetic quote rate. EUR costs are divided by this value. |
| Materials discount | % | `C389` | Numeric entry |
| Include transport | Selection | `E355` | No, Yes |
| Sea-freight cost | AUD | `G203` | Numeric entry |
| Sea-freight gross margin | % | `C204` | Numeric entry |
| Local-freight cost | AUD | `G208` | Numeric entry |
| Local-freight sell | AUD | `G209` | Explicit sell amount; not derived from the unused road-freight margin. |
| Include installation | Selection | `C152` | No, Yes |

### Additional screens and retained source fields

Each additional-screen slot accepts a whole screen count, base length, overhang at each end and cloth width. Sources are C80/D80/E80/G80 through C84/D84/E84/G84. Zero count represents an unused synthetic slot. Active slots require positive base length and width. Material identifiers are synthetic fixture labels, not current supplier choices.

The searchable source inventory retains all 478 field records with input ID, group, label, kind, unit, cell and direct consumers. It initially shows the first 80 matches and invites a narrower search. This inventory distinguishes reviewed source coverage from controls actually implemented in the UI. It does not pretend that every old validation cell, labour-day cell, kit setting or catalogue-addition slot is already a functioning r02 input.

The 14 manual quantity positions are C245, C273, C274, C275, C276, C278–C283, C285, C291 and C292. Their synthetic values have reasons, author, timestamp and an input/definition review basis. A cleared value means unresolved; a deliberate zero remains zero. The six independent inclusion positions are B254, B263, B264, B266, B267 and B270. Their review dialog captures the chosen inclusions and a reason.

## 4. Calculation behaviour and scope

### 4.1 Geometry and screen cuts

Physical width uses physical spans only. Calculation spans add extra wall-screen spans. Normal length is bays multiplied by bay length. When the odd-bay switch is selected, one ordinary bay is replaced by the recovered fixed 4 m odd-bay value. Floor area uses the source whole-square-metre downward rounding.

Cloth width is an exact lookup:

| Bay length m | Cloth width m |
|---:|---:|
| 2 | 2.2 |
| 2.13 | 2.35 |
| 3 | 3.25 |
| 4 | 4.3 |
| 4.5 | 4.7 |
| 5 | 5.3 |

An unsupported bay length withholds the calculation; it is not interpolated. The source rack lookup has different, approximate-match behaviour. This distinction must be retained when a current rack-selection service is implemented.

For continuous screens, the calculation-span width is divided by motor groups across. Individual screens start from one span width. Standard cut length divides coverage by one minus shrinkage, adds both overhangs, then rounds upward to 0.1 m. Screen quantity multiplies count, cut length and selected width.

Additional-screen cuts use a different order: round the shrinkage-adjusted base upward to 0.1 m, then add overhang. r02 preserves that distinction. Wider-sheet offcuts use the remaining sheet width; cutting is a length, not area. A sheet narrower than the selected cloth produces a specific error.

The odd-bay source does not clearly generate a complete separate odd-bay cloth set. r02 retains its count adjustment and raises the missing-set review. It does not quietly fill that gap with a new formula.

### 4.2 Wire, supports and fixings

Recovered calculations cover edge-wire runs, crosswire runs and lengths, coated wire with its 15% allowance, strainers, LS-wire rolls with their specific spare allowance, twine rolls, clips, selected plates and conditional support stock. The LS replacement answer does not suppress the original LS roll formula. r02 makes that mismatch visible and offers an explicit scope exclusion rather than silently changing the historical expression.

Selected leading-edge behaviour covers tube/profile strip dependencies, joiners, pegs, primary and secondary clips, weight fittings and hooks. Some quantities depend on manual final values. For example, changing the leading-edge stock allowance affects strip length and joiners, while no missing leading-edge generation rule is invented.

End-beam inverse length logic, brace stock divisors, support-chain multipliers, seal staple packs and profile clip pack conversion remain named review issues. Their recovered preview values are not purchase-approved quantities.

### 4.3 Drive and motor review

The driven group width is reduced by 0.8 m. The target spacing determines a rounded number of spaces; actual spacing divides the available width by that number. One additional drive position per group produces the total drive count. A zero divisor or nonpositive available width blocks the preview.

Cable location and Pinion diameter are separate input identities, even though the old workbook overloaded C99. Switching drive family does not turn the value 27 into a cable location. Ordinary Cable and slow Pinion helper calculations are represented, but the source’s manual final stock quantities remain separate and must be reviewed after configuration changes.

The recovered motor-area expression includes main cloth and additional slots 1–2; it omits slots 3–5 and offcuts. r02 reports the omission when later slots are used. Its torque bands retain the source comparison boundaries:

| Drive | Area per motor m² | Recovered torque |
|---|---|---|
| Cable | Below 600 | 100 Nm |
| Cable | 600 to below 1,800 | 300 Nm |
| Cable | 1,800 to below 2,400 | 400 Nm |
| Cable | 2,400 to below 5,800 | 800 Nm |
| Cable | 5,800 and above | Unavailable |
| Pinion | Below 1,800 | 100 Nm |
| Pinion | 1,800 to below 5,900 | 300 Nm |
| Pinion | 5,900 to below 7,000 | 400 Nm |
| Pinion | 7,000 and above | 800 Nm; no source upper bound |

These are recovered comparison bands. They do not establish safe loads or approved motor capacities. Motor speed is missing from the legacy lookup key, duplicate keys exist, and motor kW is a broken reference. r02 therefore does not emit an approved motor SKU.

### 4.4 Explicit implementation boundary

The example is a component-supply replacement study using ordinary, non-ABRI branches. It does not configure greenhouse-builder-specific mounting variants, kit supply, universal joints, smart controls, wall gearboxes, one-off materials, catalogue additions, installation labour schedules, air freight, duty or commission. Their source metadata remains available. The geometry plan, quantity port and price bridge are a bounded review tool, not a general-purpose Excel evaluator.

No data-entry control claims a manufacturer-approved range. The available report and workbook explicitly say that complete approved numeric ranges were not supplied. Source rules, technical input validity, quantity parity and engineering acceptance therefore have separate statuses.

## 5. Overrides and safe rerun

Manual quantities remain explicit values. Their stored evidence includes the reason, actor, time and definition/input basis. A geometry or other non-commercial configuration change marks all 14 allowances for review. The bulk review dialog lists every retained quantity and requires a new reason and acknowledgement; individual allowances can instead be edited or cleared. A geometry change cannot silently regenerate them.

Per-line exclusion is a proposed refinement for material and service positions. Commercial adjustments are controlled only by the commercial inputs, so a discount cannot be removed through a separate quantity edit. It retains the raw calculated or manually entered quantity and consistently suppresses that line’s review quantity and pricing. This is disclosed as a scope decision because some old formulas bypassed section or line gates. Restoring an excluded line also requires a reason.

A saved configuration contains both its generated baseline and current lines. A manual edit to a saved line does not change the immutable run. On rerun, stable `CE-LINE-<row>` keys identify Added, Changed, Unchanged, Manual edit and Removed rows. A manual edit requires keeping the saved value or using the current generated result. A removed line requires retaining it separately or removing it. No fuzzy description matching chooses a replacement.

The comparison total is the current calculated preview before keep-saved decisions. The new run records the resolved line set and its actual resolved total. Cancelling the comparison discards pending decisions and leaves saved lines and runs unchanged.

Saving requires an exact current preview signature, valid inputs, current manual review and explicit acknowledgement that the result is a local design record. A run may retain documented source findings and unavailable amounts; it cannot be issued as an operational estimate. The disabled receiving action states that definition approval is open.

### Failure and recovery

| Condition | Behaviour |
|---|---|
| Read-only reviewer | Editing and save controls are disabled; model write gates also reject changes |
| Locked estimate | Writes are refused with a clear reason |
| Other tab changes the session | Further writes pause; the local draft remains available for export |
| Input changes after preview | The saved preview signature no longer matches; save is refused |
| Failure before commit | No run or line changes; entered values and confirmation remain available for retry |
| Response lost after commit | A pending operation references the original receipt; recovery finds the original run without generating another |
| Lines saved but totals stale | Repair recomputes from saved lines and saved commercial inputs, without regenerating parts |
| Invalid local storage | Original raw data is preserved for export; no automatic overwrite |
| Backup restore | Schema, fixed context, source versions, line identities, quantities, units and prices are validated; restored session opens read-only |

The earlier issued synthetic example is immutable. r02 uses its own local-storage key and schema, leaving r01 sessions separate. Local storage is a review convenience, not a server database, backup service or authorization system.

## 6. Definition findings and review ownership

The source supplies 23 findings. This audit adds three findings for saved reconciliation, formula-display compatibility and revision-label provenance. Recording a note does not automatically approve or close the underlying engineering issue. Logical roles are proposed responsibilities, not assigned employees.

| Finding | Subject | Source evidence | Required decision or next action |
|---|---|---|---|
| REV-01 | 14 manual quantity cells | `C245,C273:C276,C278:C283,C285,C291:C292` | Define and validate each quantity rule; the overwritten formulas cannot be recovered from this file. |
| REV-02 | Six manual inclusion gates | `B254,B263,B264,B266,B267,B270` | Confirm whether each is a replacement-job exclusion or intended family behaviour. |
| REV-03 | Freight not charged | `E355,F391,A200` | Confirm commercial treatment before future quotes. |
| REV-04 | Broken motor power reference | `G92` | Supply the correct motor power mapping. |
| REV-05 | Broken ABRI branch | `C236` | Identify the original LIVSHA selector and validate the ABRI family. |
| REV-06 | Units and catalogue ID errors | `E240 and other unit cells; N273` | Confirm all active line units and the custom push-pull tube mapping. |
| REV-07 | Additional screens use main screen price | `D227:D231` | Confirm intended per-material selling rates. |
| REV-08 | Additional screen costs are shifted | `J227:J231` | Correct only after confirming the intended cost basis and row mapping. |
| REV-09 | Screen area omits added screens | `G74` | Define which screen areas should drive motor load. |
| REV-10 | Dormant cable lookup errors | `TABLES!K9,K13,K15,K33,K35,K37` | Test Cable with its required location and selections. |
| REV-11 | Overloaded and unreachable selectors | `G71,C43,C63,G102` | Separate selectors and decide which historical variants remain supported. |
| REV-12 | Incomplete cached screen list | `TABLES!B242:B432` | Replace the list definition with a verified complete screen catalogue. |
| REV-13 | Catalogue is a partial historical cache | `PARTS, PARTS2, [4]!Exchange` | Obtain current catalogue and approved pricing / FX definitions. |
| REV-14 | Offcut and extra-screen price condition | `O78,O80:O84,M78,M80:M84` | Confirm special cost precedence and the intended lookup keys. |
| REV-15 | Senior installer references | `C174,D174,E174` | Validate a nonzero installation example with technician roles. |
| REV-16 | Section exclusion bypasses | `C245,C273 and other manual quantities; C259,C260,C303,C304` | Review each part gate before implementing section suppression. |
| REV-17 | LS wire replacement selector | `C59,C240` | Confirm new bed versus replacement-wire rules. |
| REV-18 | Dropper reference mismatch | `G107` | Confirm the intended selector, units and use of the result. |
| REV-19 | Motor lookup ambiguity | `TABLES!D48:F58` | Define an unambiguous motor selection key and approved sizing limits. |
| REV-20 | Historical price overrides | `D273,D276,D328,J273,J328,L320` | Decide which are quote exceptions versus reusable cost rules. |
| REV-21 | Installation productivity division | `G194` | Define the unavailable state when no hours are entered. |
| REV-22 | Static CSV is not an engine | `CSV worksheet` | Generate a new reviewed MYOB mapping after rule validation. |
| REV-23 | One historical quote cannot validate every branch | `Whole model` | Validate representative families and boundary conditions before operational use. |
| AUD-01 | Saved reconciliation is 142 Match and one error | `Reconciliation!L7:L149` | Repair the blank-rate comparison on line 219 and rerun in native Excel; do not inherit the report’s blanket pass. |
| AUD-02 | Saved formula display errors | `Rules!G7:G3112` | FORMULATEXT is stored with an _xludf prefix and #NAME? caches. Read active formula XML and original text; validate formula display in Excel. |
| AUD-03 | Report and workbook revision labels differ | `Summary!A4; Guide; report source section` | Use exact attachment hashes. The r02 filename contains r01 labels; record that difference without renaming source evidence. |

The specialist estimator should first resolve overwritten quantities and replacement-scope gates. Engineering review owns operating limits, motor loading and accepted branch examples. Catalogue ownership covers identifiers, units, stock lengths and current prices. Estimating and Finance must settle FX, rounding, freight, discount, commission and tax policy. Those decisions are needed before application integration can make reliable operational promises.

## 7. Record evidence and receiving modules

Every saved run retains the exact fixed context, definition version, source hashes, raw inputs, normalized values and units with source references, additional-screen entries, manual evidence, line gates, exclusions, illustrative prices, findings, comparison resolutions, generated baseline, resolved lines, calculated price bridge, timestamp and explicit `operationalReady: false` state.

The exported JSON is a complete local review pack. It is not a MYOB import file or supplier order. Source documents remain separate and their identity is recorded by hash. Review notes and the local audit trail retain who the fixture actor represents; real identity and authorization must be supplied by the application.

| Receiving module | Required connection |
|---|---|
| Estimation Wizard / configuration container | Same estimate, option, draft revision and configuration ID; transactional apply of reviewed lines; approved pricing policy; permission, lock, scope and source-version rechecks |
| Parts and catalogue | Stable rule keys; description, legacy part ID, simPRO ID and MYOB ID as separate fields; current source version and approved calculation-to-purchase unit conversion |
| Engineering review | Exact site and scope, motor and stock assumptions, failed checks, accepted examples, correction ownership and approved definition version |
| Project readiness | Approved supply scope and unresolved obligations; no installed asset or procurement authorization inferred from a saved configuration |
| MYOB / Finance | Confirmed tax, cost and sell policy, current inventory mappings, one-off treatment and no-purchase rules; no live posting is performed |
| SharePoint | Intended business-document authority for approved source packs and issued reports; the standalone design creates no external upload |

The handover dialogs show record-specific context for these destinations. They explain receiving contracts and do not masquerade as live application navigation.

Traceability remains within ES-08 / EST-06 and the adopted estimating E5 increment, with CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009 retained. The work adds no parent requirement, E7 increment or new delivery sequence. G06 now has received formula evidence; it is not closed because validated definitions, ranges, catalogue mappings and accepted cases remain incomplete.

## 8. Visual design and interaction quality

The HTML follows the supplied r20 board: navy `#242A37`, green `#62BB46`, light `#F5F6F8` background, white panels, embedded Roboto with Verdana fallback, restrained borders and the established 6/7/10 px radius scale. The light header, compact context strip, contiguous summary cells and underlined active tab retain the app’s visual hierarchy.

Progressive disclosure keeps source detail close to the work without putting hundreds of old cells on the main form. The schematic and live cut results explain geometric changes; per-line working exposes the exact formula when needed. Status text distinguishes calculated, manual, zero, excluded and unresolved rows. Release status remains visible without a fabricated readiness score.

Responsive layouts move the calculation sidebar below the form on tablets and stack fields on phones. The pricing bridge moves ahead of the long parts list on narrow screens. Parts become labelled row cards at narrow widths. The view tabs wrap rather than clipping. Controls have visible keyboard focus; phone controls meet a 44 px minimum target height. A skip link, labelled fields, semantic tables, modal dialogs, source text and live input status support keyboard and assistive use. Numeric values and text provide the same essential information as the SVG.

Dialogs preserve unsaved edits until the user confirms cancellation. Focus returns to the opener. Arrow keys, Home and End move focus through the view navigation. Native visual evidence covers desktop, tablet and phone widths; it does not replace an independent assistive-technology audit or owner/device acceptance.

## 9. Review demonstration

1. Open Configure with the synthetic Northbank inputs. Inspect the floor area, standard cloth and greenhouse plan. Open Cut length to see its source expression and normalized shrinkage.
2. Review Parts & working. Search `C273` and inspect its manual provenance. Use the zero/excluded filter to see the retained inactive positions. Open the six gate decisions.
3. Inspect Pricing. Clear a required rate with a reason and observe that the complete total becomes unavailable. Restore an explicit rate before continuing.
4. Save a first review run with the required acknowledgement. Open its complete snapshot and note the stable configuration ID and source hashes.
5. Adjust a saved cloth quantity with a reason. Load the changed study to add one bay. Observe live quantity changes and the 14 manual allowances requiring review.
6. Review the allowances, then compare the rerun. Keep the saved manual cloth allowance or use the generated result explicitly. Excluding a saved line creates a separate removal decision.
7. Save the rerun. Inspect both immutable runs and the current resolved total. The earlier issued example remains unchanged.
8. In Preview options, exercise failure before commit, lost response and stale totals. Recover the original receipt or repair saved totals without repeated generation.
9. Record an owned next action against a definition finding. Export the review pack and restore it; the restored session opens read-only.

## 10. Source manifest and delivery status

| Evidence | Exact identity |
|---|---|
| Supplied normalized workbook | `PPO-Screen-Estimator-Reverse-Engineering-r02.xlsx` |
| Workbook SHA-256 | `00b8ac02d13bb2229eb690c77cb8ed7e20f089d25b0a0efaef2ba3ab6bc55484` |
| Supplied rules report | `PPO-Screen-Estimation-Inputs-and-Rules-Report-r01.docx` |
| Report SHA-256 | `3f99199989f74da5f5975ec14102b8e4f1811237bde25c5db577ae273d277c4e` |
| Original workbook hash reported by the attachments | `b51de1c01c44c0fc205b4db0d31fb2ab8b106c25e52110e7363bbedc03919239`; original not independently supplied this turn |
| Supplied r20 theme SHA-256 | `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` |
| Embedded font CSS SHA-256 | `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef` |
| Recovered quantity definition | `SS-RECOVERED-QTY-r02` |
| Synthetic prices | `SYN-PRICE-02` |

The implementation is a self-contained HTML assembled from plain JavaScript, CSS, sanitized evidence metadata and the existing embedded fonts. It adds no framework, runtime dependency, service, application route, database migration or deployment. The established standalone approach remains suitable for reviewing the product and source rules before adopting a server calculation contract.

The issued r01 artifacts remain unchanged. The new r02 package is published through the existing [draft PR #210](https://github.com/deanrfiedler-gif/powerplants-one/pull/210). The [evidence record](../../../testing/evidence/specialist-r02/README.md) distinguishes source-cache checks, synthetic model checks, native browser execution and visual review. Engineering approval, native Excel validation, current catalogue acceptance and operational application integration remain separate work.

Final verification passed 26 model groups and 24 native Chrome groups with no console or page errors. The six views were checked at five widths from 320 to 1440 px. The evidence record identifies the exact tested source and HTML hash, preserves all 16 capture hashes and documents the initial complete and final targeted visual reviews. These checks verify the bounded review implementation; they do not approve the recovered engineering rules.
