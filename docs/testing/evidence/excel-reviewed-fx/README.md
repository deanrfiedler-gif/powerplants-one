# Excel reviewed FX — execution evidence

Owner: Dean Fiedler. Source: `codex/excel-import-reviewed-fx`, based on managed pricing PR #487 `3c75782`. User-authorised continuation; scope BC-04 / PPO-010 / EST-04/05/07/08 / XI-04/06/07/08. Code delivery, CI, independent review, owner acceptance and deployment remain separate.

The [decision](../../../decisions/excel-import-reviewed-fx.md) and [contract](../../../contracts/excel-import-reviewed-fx.md) retain original foreign supplier tiers and a dated rate/evidence snapshot inside independently reviewed native Cost Source revisions. `SYN-EST-FX-01` produces exact unit-first AUD prices; an explicit Excel comparison saves the existing atomic successor. Migration 0099 adds guards to existing tables without rewriting original data or introducing a table, dependency, identity type, capability, seed or grant.

## Executed local proof

- 136 focused Estimating, Cost Source, CPQ, Excel and migration-registry unit cases pass in the final sequential run. FX cases include independent expected values for ties and fractional quantities, six-place canonicalisation, zero/overflow, explicit direction/currency bounds, date/expiry refusal, duplicate tiers, mismatched derived AUD values and unchanged legacy command shapes. A final FX-only run also proves acceptance/refusal around the UTF-8 source evidence envelope.
- [Twenty-five distinct database/upgrade scenarios](database.json) pass. Existing Cost Source and managed-pricing behaviour remains intact. FX proof covers exact read-only source/estimate previews, independent explicit FX confirmation, concurrent duplicate saves, original foreign and workbook values, preserved quote totals and excluded private output, altered replay, rate corrections, unreviewed/expired/stale/refused access, exact old-operation recovery, re-import binding removal and retained omissions, and 500-line conversion. Deliberately altered AUD tiers, missing review audit, invalid binding dates and changed conversion evidence are refused with the full graph rolled back.
- Populated 0098 with an existing priced estimate, reviewed source and quotation upgrades through only 0099 with exact original rows, receipts, source bytes, grants and ledger. Reapply/reseed is inert. Historical E2 upgrade across 0026, reserved Products 0052 after 0099 and Windows CRLF hosted-demo upgrade also pass.
- Compiled build, typecheck, full lint and final changed-script/test lint pass. Foundation, naming and studio checks pass. Naming retains 7,995 project-instruction characters. Studio retains 362 entries, 47 components and 208 routes, with 334 unreviewed and 28 stale entries; no visual review is granted by this backend work.

Eight compiled HTTP scenarios pass across Cost Sources, FX, managed pricing, re-import and verified quotation. The new round trip covers no-write preview, 64 KiB transport refusal, scoped creation, exact independent FX review, price comparison, atomic save, retained evidence, original retry and quotation continuation.

## Large output and recovery

[Browser checks](capacity-browser.json) pass in Chrome 155.0.8059.40 at 1440, 390 and 320 px with all 500 descriptions, unchanged AUD 1250.00 sell total and no document-width overflow. The 320 px capture was inspected; the existing Quantity heading wraps. No template/CSS change or new visual acceptance is claimed.

[Independent PDF extraction](capacity-pdf.json) confirms all 500 distinct descriptions, total 1250.00, 24 pages, no attachments and no tested private foreign-price/rate fields in text or metadata. The PDF is 969,959 bytes, SHA-256 `57b4f1812c19e7719a5b333652041c950a2325eb28fcc781c1ee2b148adf29ba`.

[Actual restart recovery](restart.json) passes after stopping and starting both the compiled application and PostgreSQL. Exact source revisions and review audits, all 500 bindings, both workbooks, estimate versions, comparison/decisions, quotation and HTML/PDF survive. Original operation receipts recover and HTTP retries add no rows. The fixture maps 500 lines to one reviewed FX revision: authored USD 0.670000 × 1.500000 AUD/USD rounds to AUD 1.01 per unit and AUD 505.00 cost, with the AUD 1250.00 sell total unchanged. Preview took 2,023 ms and save 7,699 ms locally; these are observations, not throughput commitments.

Reproduce with the named tests and `scripts/excel-import-restart.ts write fx` / `verify` across real restarts. Locally set `PPO_EXCEL_PROOF_DIRECTORY=verification-evidence/excel-fx-restart` to preserve earlier artifacts. Full synthetic workbook, checkpoint, HTML/PDF and viewport files remain in that ignored directory; compact results are committed. CI runs and retains the combined import/re-import/FX/quotation restart path.

## Corrections and limits

Initial negative tests expected field-specific or raw SQL messages, while the existing application deliberately returns `InvalidData` with field errors or `InvalidRelationship`. Tests now assert those existing contracts and retain the same refusal and whole-graph rollback expectations. The initial populated-upgrade fixture selected a single source for mixed-unit workbook lines; selecting the exact unit-matching line corrected the fixture without adding unit conversion. The initial concurrent unit run hit the unchanged CPQ five-second execution budget while the build was running; all 136 cases passed on a subsequent sequential run without changing its code or deadline.

The fixture uses authored synthetic USD prices and an authored 1.500000 AUD-per-USD rate. These are not market rates or approved operational policy. Original prices/rates retain six places; native AUD unit prices and line extensions retain two-place HALF_UP arithmetic. Complete source content is limited to 28 KiB; native generic refresh retains its 100-line contract and refuses FX. Excel remains bounded at 500 complete lines and a 1 MiB native costing envelope. Multi-source operational throughput and maximum history size are not benchmarked.

Native FX controls, non-AUD workbook templates, live rates, cross/inverse or unit conversion, landed costs, tax/hedging/accounting policy, operational acceptance and deployment remain open. Issued source snapshots, existing templates and prior command contracts are preserved.
