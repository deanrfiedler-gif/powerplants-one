---
document_id: PPO-CONTRACT-EXCEL-CAPACITY
date: 2026-10-14
owner: Dean Fiedler - prototype owner
status: Synthetic backend contract; independent acceptance open
versioning: git
---

# Larger Excel workbook capacity

Step 6 capacity under BC-04 / PPO-010 and XI-03/04/06/07/08 follows the [decision](../decisions/excel-import-capacity.md). Existing [first save](excel-import-persistence.md), [comparison and re-import](excel-import-revision.md) and [verified quotation](excel-import-quotation.md) workflows retain their authority, concurrency, decimal, source and recovery rules.

The versioned internal profile `PPO-EXCEL-CAPACITY-1` allows 1–500 complete populated lines and a canonical UTF-8 native costing envelope of at most 1,048,576 bytes. The final re-import projection includes every explicitly kept native line; 500 incoming lines plus one kept omission is refused before source storage. A 501-row workbook is rejected as a whole. No splitting, truncation or silent removal occurs. Line descriptions, sources, scope, decimal precision, per-line monetary and control-total bounds retain their existing validation.

The preparation endpoint exposes the 500-line workbook limit; new review evidence carries `capacity_version` inside its hash and retains original tables. Preview uses conservative UTF-8 reason sizing and normalised empty scope text. Actual first save and resolved re-import are independently checked against the exact canonical command size. Changed limits invalidate outstanding reviews through the review hash; accepted original operations recover without re-parsing or re-storing.

Quotation review and acceptance support 500 explicit include/print choices within a 128 KiB HTTP body. All 500 decisions remain bound to the exact saved estimate. Customer output uses the existing safe snapshot and template. Private import evidence remains separately authorised. Rendering completion remains distinct from Draft acceptance.

The compressed/expanded package bounds remain 5/20 MiB, with 256 entries, 100,000 total XML elements, depth 64 and 1,000 table rows. Comparison still refuses histories above 100 accepted workbooks per option. These safeguards are independent; this increment does not promise to accept every workbook with 500 rows. The upload command reserves 64 KiB beyond the existing base64 envelope for explicit omission decisions and confirmations.

Migration 0097 widens only the relevant storage checks and introduces a deferred requirement for exact accepted Excel evidence on estimates above 100 lines. Existing native graph checks continue to verify totals, source mappings, projections, lineage, receipts, audit and outbox. The first-import header checks full completeness once; per-line triggers verify exact ordinal/content/section/source/include/print membership. Immutability plus unique ordinal, identity and key constraints prohibit subsequent additions or edits. Existing SQL migration bytes, rows, seeds and grants are retained.

Native manual/CPQ and specialist command profiles remain at their existing limits. Editing a larger imported estimate through those receivers is not enabled by this work; use a reviewed whole-workbook successor and verified Excel Draft continuation. Larger commercial issue/approval flows, new UI, operational performance guarantees, FX, landed costs and richer pricing sources are separate increments. The [execution evidence](../testing/evidence/excel-capacity/README.md) distinguishes local proof, CI, owner review and deployment.
