---
document_id: PPO-010-EXCEL-HO
revision: r01
date: 2026-09-15
owner: Dean Fiedler - prototype owner
status: Design artifacts prepared and component-checked; browser and operational acceptance pending
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
---

# Excel estimate import design handover

## Delivered outcome

The r01 package defines a controlled Excel-to-PPO estimate workflow and provides a working calculation workbook plus an interactive standalone design preview. The application importer is not implemented. This contribution sits under PPO-010 / issue #10 and preserves the existing E1–E6/P01–P12 sequence.

| Deliverable | Location and use |
|---|---|
| Workbook assessment | [Evidence, findings and departmental sample questions](../blueprints/excel-estimate-workbook-assessment.md). Clearly distinguishes the synthetic assessment from unavailable operational workbooks. |
| Standard workbook r01 | `powerplants-one-estimate-workbook-r01.xlsx`, delivered with this conversation. Seven sheets, 12 synthetic lines, seven sections and 100 prepared line rows. Use Save As and replace the example context/data. |
| Field mapping and specification | [Import specification](../contracts/excel-estimate-import.md): six named tables, line mappings, arithmetic, current context, permissions, original source retention, atomic commit, revision comparison, customer safety and XI-01–XI-08 future acceptance. |
| Interactive import preview | [Open HTML](../blueprints/excel-estimate-import.html). Upload the supplied synthetic workbook or choose a built-in example. Inspect rows, review errors, make reasoned demo adjustments, compare r02, inspect customer-safe fields and explore failure/recovery states. |
| Bounded implementation plan | [Dependency-ordered pilot](excel-estimate-import-plan.md). Preserves current 100-line/AUD arithmetic boundary and identifies the next capacity/policy work. |
| Decision record | [Authority and scope](../decisions/excel-estimate-import-design.md). No application/schema/permission changes. |

## Workbook and preview identities

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| powerplants-one-estimate-workbook-r01.xlsx | 48741 | 698bc4c0cd8dd844550a1725e2435d16aece0004d95420f5db2e1083f9aeb515 |
| excel-estimate-import.html | 74523 | 4677fa518ea26b019629f16e655905650b4cb175819b2c01d5a46231e2f4131b |
| fixture.json | 4212 | 447fbdbed930b680d52725ebbfd40614f31d436c9835a591a006387f9d83eccb |

This is a new design with no predecessor artifact. No accepted UI-baseline registry entry is added. HTML uses one `ppo-excel-import` scope container and omits the application rail/logo. New references are synthetic design-fixture references, not claimed as current seed records.

## Verification completed

- Twenty standalone model checks passed, including the actual exported workbook after independent XML extraction. Cases cover precise fractional rounding, missing vs zero amounts, duplicate references, offsetting line discrepancies, context/scope/facility mismatch, 101-line refusal without truncation, empty input, price precision, allowance, invalid dates, source/unit mapping, include/print, reordered rows and retained revisions.
- Workbook recalculation verified the labour change from 80 to 96 hours (+1,120.00 cost/+1,760.00 sell), blank/zero cost, missing-reference row preservation, incomplete new row/unknown total handling and the last prepared row's half-cent rounding. Temporary changes were restored before final export.
- Independent ZIP/XML and Decimal checks passed: 12 lines, seven sections, seven worksheets, 12 validation rules and 2,025 formula cells; no cached Excel error values. Totals: 62,952.38 cost and 85,607.63 sell/included sell.
- All seven sheets were rendered and visually inspected, including both sides of wide line/export tables. The final export area and Overview were inspected again after refinements. No clipped key values were identified in these captures.
- JavaScript syntax checks and static HTML checks passed: one scope container, unique static IDs and no remote script/style/image dependencies.
- Foundation, prototype and naming checks passed: 78 requirements, 1,970 local links, 1,046 text files checked for conflict markers and 171 document records. No errors. These are documentation assurance, not runtime or business acceptance.

## Verification limits and open items

**Browser interaction and visual acceptance are not complete.** The environment's browser access policy rejected the local preview URL/file. Browser binary acquisition was also unavailable. No alternative access path was used to bypass that policy. The HTML reader, event wiring, responsive layout, focus behaviour, dialog placement and customer-draft DOM therefore require actual browser verification. Static/model tests do not establish them.

**Native Excel behaviour is not verified.** The available spreadsheet engine recalculated/rendered the workbook and its exported XML was checked. Desktop Excel was not available. Formula cells are visually differentiated but are not locked in this r01 workbook; native protection remains a template-adoption task. The workbook itself states that limitation.

**Theme source mismatch:** attached bytes identify r16 although attachment metadata advertises r19. The known r16 tokens and maintained UI guidance were used. Obtain the actual r19 file and compare before adopting this as a UI baseline.

**Operational compatibility is not assessed.** Two or three redacted departmental workbooks are still needed. The supplied example proves the proposed structure and bounded arithmetic, not the department's full formulas, prices, source integrations, scale or financial policies.

The preview reads files in browser memory; its versions and receipts disappear on reload. It makes no backend request. Actual upload security, server permission checks, immutable storage, race/replay behaviour and process-restart recovery remain implementation work. Formula-review declarations do not certify engineering adequacy.

## Reproduction and continuation

Sources are in [excel-estimate-import](../blueprints/excel-estimate-import/). `build-preview.mjs` creates the standalone HTML from the CSS, model, reader, UI and fixture; optional supplied theme source embeds its existing Roboto font. `check-model.mjs` runs the model checks with Node. `check-workbook.py` reads the delivered XLSX using Python standard-library ZIP/XML/Decimal and writes an extracted dataset for the model checks.

`build-workbook.mjs` uses the provided primary-runtime artifact library. Run a copy in a scratch directory linked to its documented dependencies, passing fixture JSON and an output directory. It does not add a package to PPO or mutate the application. Do not run workbook authoring in production or put operational samples in Git.

Next bounded step: review the r01 workbook against departmental examples, verify native Excel and the actual r19/browser presentation, then invoke the upload/review/controlled-draft pilot in the implementation plan. Keep this PR in draft while its presentation verification is incomplete. Merge, application delivery and acceptance are separate claims.
