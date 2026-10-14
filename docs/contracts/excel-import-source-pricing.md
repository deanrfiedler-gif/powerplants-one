# Excel managed sources and reviewed pricing

Owner: Dean Fiedler. Scope: BC-04 / PPO-010 / EST-02/04/05/07/08 / XI-04/06/07/08. Status: synthetic backend implementation; independent acceptance open. [Decision](../decisions/excel-import-source-pricing.md).

## Workflow and authority

Save and reconcile the workbook first using the existing Excel commands. Select exact current native line IDs and independently reviewed Cost Source revision IDs, expected source header versions and an explicit pricing date. Supplier labels and workbook references are never implicit source mappings. A previously reviewed historical revision remains an explicit choice under the native source contract; a new source draft is never silently substituted.

Preview displays original workbook values, current saved values, proposed prices, selected tiers, source revision/hash/review event, expiry warnings and before/after totals. Omitted kept lines have no value in the latest workbook and are labelled with a null original; their current saved value remains visible. Applying the exact reviewed proposal creates one immutable successor with typed bindings and a separate pricing evidence record. Original workbook bytes and imported values remain unchanged. Sell prices, quantities, units, scope and descriptions do not change through this command.

The receiver reuses native company/source access, independent source-review evidence, exact-unit matching, quantity tiers, effective/expiry dates, decimal arithmetic and cost-not-above-sell policy. AUD, ExcludingTax and Synthetic remain explicit. Unknown expiry requires review; it is not indefinite validity. Up to 500 selections and 500 complete resulting lines are supported within the existing 1 MiB costing envelope. The HTTP body is bounded at 256 KiB; generic native refresh remains at 100 lines.

## API

Paths start `/api/v1/estimating/estimates/[id]`. POST commands use current authentication and origin checks; all responses are private/no-store.

| Method/path | Contract |
|---|---|
| POST `/excel-source-pricing/preview` | Native `estimate_version_id`, `pricing_date`, and 1–500 `selections` of `line_id`, `source_id`, `revision_id`, `expected_source_version`. No writes. Returns complete workbook/current/priced comparison and `review_hash`. |
| POST `/excel-source-pricing` | Native common operation/schema/reason, `expected_version`, exact `proposal`, `comparison_hash` containing the Excel preview's `review_hash`, and `reviewed: true`. Recomputes current scope/source evidence before atomic acceptance. |
| GET `/versions/[versionId]/excel-source-pricing` | Exact persisted pricing review, predecessor and original-import pointers, actor/time/reason and original receipt reference. Current access is checked for successor, predecessor and original import. |

The existing reviewed Cost Source register supplies exact candidates. The existing original import/source endpoints remain the workbook authority. The pricing evidence includes its exact `import_version_id`; no additional workbook upload or duplicate original is created. `ExcelImport:PriceSources` receipts use current historical access, including source access, before returning the accepted original result. Reordered selections canonicalise to the same intent; a changed payload under the same operation ID conflicts. A stale source header, estimate, scope/context or comparison requires fresh review. An accepted retry does not reprice against later source versions.

Migration 0098 adds immutable pricing evidence with deferred checks binding the exact predecessor/import, unchanged non-price fields, selected and inherited bindings, source header/revision, totals, audit, receipt and outbox. Existing native binding guards verify exact tier/date/unit/cost evidence. Large versions require either accepted original/re-import evidence or this accepted pricing graph. Evidence can only attach in the version's inserting transaction; no legacy provenance backfill occurs. Old migrations, command hashes, ledgers, grants, seeds and records are retained.

## Re-import and quotation

Re-import compares against the current priced version and explicitly reports managed binding disposition. Replaced workbook lines drop bindings when quantity, unit, cost, source or effective date differs. Explicitly kept unchanged omissions retain their exact bindings. The existing changes confirmation accepts those replacements; a new pricing choice requires a fresh preview and successor. There is no background refresh.

Verified Excel Draft continuation resolves the priced version's exact workbook include/print mapping and the current saved estimate hash. Every unmapped retained line still requires explicit choices. Source evidence and unit costs remain internal; output uses the existing customer-safe renderer. A pricing successor does not amend an earlier quotation or confer commercial approval.

FX, landed-cost allocation, currency/unit conversion, sell-price policies, live supplier/ERP connections, native controls and deployment remain separate. [Execution evidence](../testing/evidence/excel-source-pricing/README.md) records checks and limits separately from owner acceptance.
