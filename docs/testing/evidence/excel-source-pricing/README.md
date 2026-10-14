# Excel managed cost sources and reviewed pricing — execution evidence

Owner: Dean Fiedler. Source: `codex/excel-import-source-pricing`, based on capacity PR #486 `b2aa17b`. User-authorised continuation; scope BC-04 / PPO-010 / EST-02/04/05/07/08 / XI-04/06/07/08. Code delivery, CI, independent review, owner acceptance and deployment remain separate.

The [decision](../../../decisions/excel-import-source-pricing.md) and [contract](../../../contracts/excel-import-source-pricing.md) define separately reviewed pricing successors. Exact native line/source/revision selections reuse the independently reviewed Cost Source pricing rules, preserve workbook originals and retain immutable native bindings and comparison evidence. Migration 0098 is additive and seedless; no new dependency, capability or grant is introduced.

## Executed local proof

- 132 focused Estimating, Cost Source, CPQ, Excel and migration-registry unit cases pass. The new command accepts 500 exact selections, rejects 501, duplicate selections and caller-supplied prices, canonicalises ordering, requires explicit confirmation and retains the native generic 100-line limit.
- [Thirty distinct database and upgrade scenarios](database.json) pass. Coverage includes existing Cost Source, Excel re-import and quotation behaviour; workbook/current/priced totals; concurrent duplicate commands; unchanged originals; stale source/estimate and altered replay refusal; reviewed-source, date, expiry, quantity-tier, unit, company and permission checks; full rollback on an injected evidence insert failure; binding removal and kept-line inheritance; and 500-line pricing with 500-item Draft continuation. Populated 0097, historical E2 across 0026, reserved Products 0052 after 0098 and Windows-encoded hosted-demo upgrades preserve their original rows, grants and ledgers. Repeated migration/seeding is inert.
- Seven compiled HTTP scenarios pass across `estimating-sources`, `excel-source-pricing`, `excel-reimport` and `excel-quotation`. The new route proves exact read-only comparison, atomic save, original receipt recovery, retained review, access denial, quotation continuation and the 256 KiB request refusal.
- Build, typecheck, full lint and changed-script/test lint pass. Foundation, naming and studio checks pass. Naming retains 7,999 project-instruction characters. Studio retains 362 entries, 47 components and 208 routes, with 334 unreviewed and 28 stale entries; backend work grants no visual acceptance.

## Large priced quotation and recovery

[Browser checks](capacity-browser.json) pass in Chrome 155.0.8059.40 at 1440, 390 and 320 px: all 500 descriptions, unchanged AUD 1250.00 sell total and no document-width overflow. The 320 px capture was inspected; the existing Quantity heading wraps. No template/CSS change or new visual acceptance is claimed.

[Independent PDF extraction](capacity-pdf.json) confirms all 500 distinct line labels, total 1250.00, 24 pages, no attachments and no tested private source fields in text or metadata. The PDF is 969,959 bytes, SHA-256 `e3b9ab47d8a83852080b2105fc019ca5399bf11c38c5ec9f50ab01daced9b469`.

[Actual restart recovery](restart.json) passes after stopping and starting both the compiled application and PostgreSQL. Original and revised workbook bytes, the pricing successor, 500 exact source bindings, source revisions/review events, immutable comparison, native versions, 500-item Draft, retained HTML/PDF and original receipts are unchanged. Accepted retries add no rows. The bounded fixture maps all 500 lines to one independently reviewed source revision; preview took 1,730 ms and save took 7,914 ms locally. These are measurements, not a production concurrency or multi-source latency commitment.

Reproduce with the named test suites and `scripts/excel-import-restart.ts write pricing` / `verify` across actual application and PostgreSQL restarts. Locally set `PPO_EXCEL_PROOF_DIRECTORY=verification-evidence/excel-source-pricing-restart` to retain earlier capacity artifacts. Full synthetic workbook, pricing checkpoint, HTML/PDF and viewport artifacts remain in that ignored directory. CI runs the pricing path and retains the combined import/re-import/pricing/quotation recovery evidence.

## Corrections and limits

Initial route imports used an unavailable alias and were corrected to repository-relative imports. The new fixture was corrected for the nested Cost Source read DTO and preserved workspace input. The new SQL guard needed parentheses around JSON extraction before array-key subtraction. A refusal test initially captured its mutation baseline before creating a foreign session; moving that session creation before the snapshot removes its legitimate session audit event from the comparison. The unchanged no-mutation assertion then passed, and the HTTP fixture follows the same order. No existing assertion or deadline was relaxed.

The reviewed receiver supports at most 500 complete lines within the 1 MiB costing envelope; the existing generic native source refresh remains bounded at 100. FX, landed-cost allocation, currency/unit conversion, sell-price policy, live supplier/ERP connections, native import/pricing controls, operational acceptance and deployment remain open. Original source snapshots, templates and prior command contracts are preserved.
