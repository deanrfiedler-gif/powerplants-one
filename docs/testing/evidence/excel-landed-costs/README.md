# Excel reviewed landed costs — execution evidence

Owner: Dean Fiedler. Source: `codex/excel-import-landed-costs`, based on FX PR #488 `0a2b780`. User-authorised continuation; scope BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Code delivery, CI, independent review, owner acceptance and deployment remain separate.

The [decision](../../../decisions/excel-import-landed-costs.md) and [contract](../../../contracts/excel-import-landed-costs.md) define explicit AUD freight/duty, exact cent allocation and reviewed atomic successors. Migration 0100 adds nullable native binding evidence and guards; original fields, source/FX evidence, workbooks, receipts and quotations remain preserved. Historical upgrade comparisons explicitly represent the newly added null column without hiding a non-null value.

## Local verification

119 focused Estimating/Cost Source, CPQ, Excel, FX/landed and migration unit cases pass. Four relevant re-import/pricing units pass again after the category inheritance correction. [Thirty-four distinct database/upgrade scenarios](database.json) pass, including all existing native source, managed pricing and FX cases plus exact landed allocation, concurrent replay, tampering/rollback, stale/revoked access, retained omissions, category changes and 500-line continuation. Independent SQL allocation agrees with Unit, Line and BaseCost shipment examples.

Populated 0099 with retained FX-priced workbook, independent source review and quotation adds only 0100, preserving original fields/rows/receipts/grants and ledger; reapply/reseed is inert. Earlier populated 0097/0098 upgrades, historical E2 across 0026, reserved Products 0052 after 0100 and Windows CRLF hosted-demo upgrade also pass.

Final compiled build, typecheck, full lint, changed-file lint, naming and studio checks pass. Naming retains 7,994 project-instruction characters. Nine compiled HTTP scenarios pass across native sources, FX, landed pricing, re-import and exact quotation. The new round trip proves read-only comparison, scope denial, exact confirmation, duplicate/transport refusal, atomic save, original retry and retained evidence. Studio retains 362 entries, 47 components and 208 routes, with 334 unreviewed and 28 stale entries. No UI/component change or visual acceptance is claimed.

## Large output and recovery

[Browser checks](capacity-browser.json) pass in Chrome 155.0.8059.40 at 1440, 390 and 320 px with all 500 descriptions, unchanged AUD 1250.00 sell total and no document-width overflow. The 320 px capture was inspected; the existing Quantity heading wraps. No template/CSS change or new visual acceptance is claimed.

[Independent PDF extraction](capacity-pdf.json) confirms all 500 distinct descriptions, total 1250.00, 24 pages, no attachments and no tested private supplier/FX/allocation fields in text or metadata. The PDF is 969,959 bytes, SHA-256 `6269942b9a27bacee305b6e8610f5a904a9779f8423343dee3c012167cd4c36d`.

[Actual restart recovery](restart.json) passes after stopping and starting both the compiled application and PostgreSQL. Exact source revisions and review audits, all 500 bindings and allocation evidence, both workbooks, estimate versions, comparison/decisions, quotation and HTML/PDF survive. Original operation receipts recover and HTTP retries add no rows. The fixture maps 500 lines to one reviewed FX revision: USD 0.670000 × 1.500000 AUD/USD rounds to AUD 1.01 per unit and AUD 505.00 base cost. Separately evidenced AUD 50 freight and AUD 25 duty allocate AUD 0.15 per line, yielding AUD 580.00 landed cost. The AUD 1250.00 sell total is unchanged. Preview took 2,853 ms and save 13,802 ms locally; these are observations, not throughput commitments.

Reproduce with the named tests and `scripts/excel-import-restart.ts write landed` / `verify` across real restarts. Locally set `PPO_EXCEL_PROOF_DIRECTORY=verification-evidence/excel-landed-restart` to preserve earlier artifacts. Full synthetic workbook, checkpoint, HTML/PDF and viewport files remain in that ignored directory; compact results are committed. CI runs and retains the combined import/re-import/FX/landed/quotation restart path.

## Corrections and limits

The initial migration draft lacked a terminator after a copied live function definition. Subsequent database runs exposed trigger names colliding with PostgreSQL OLD and local JSON loop variables; a correction also briefly left an invalid identifier. These implementation defects were corrected before the passing persistence proof. The first populated-upgrade fixture included standalone freight, correctly refused by the new duplicate-cost rule; it now uses the explicit Product-only capacity workbook. A test named the existing re-import comparison field incorrectly and was corrected to source_binding_changes. The retained-line quotation fixture was corrected to supply the existing explicit include/print choices after re-import. Final regression results supersede these failures without changing acceptance thresholds.

Review added category to landed inheritance checks: changing an allocated Product to a different category drops its typed allocation, while ordinary historical source binding shapes remain unchanged.

The authored rates/charges and `SYN-EST-LANDED-01` are synthetic policy. Unsupported two-place unit representations are refused, not approximated. Positive standalone Freight lines, duplicate charge identities/references and incompatible units are refused; the explicit exclusion assertion is still necessary for undisclosed charges embedded in manual/source prices. Native controls, foreign charge conversion, operational customs/tax/accounting policy and deployment remain open. Capacity timings describe one synthetic case, not operational throughput.
