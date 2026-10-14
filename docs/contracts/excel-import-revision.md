---
document_id: PPO-CONTRACT-EXCEL-REVISION
date: 2026-10-14
owner: Dean Fiedler - prototype owner
status: Synthetic backend contract; independent and owner acceptance open
versioning: git
---

# Revised workbook comparison and controlled re-import

Step 4 of the [Excel plan](../delivery/excel-estimate-import-plan.md), implementing XI-03/04/05/07/08 under PPO-010, EST-02–EST-05, EST-07/08 and DOC-01/02. Read the [decision](../decisions/excel-import-revision-backend.md), [first-save contract](excel-import-persistence.md) and [source specification](excel-estimate-import.md). This is a private synthetic backend; native controls and quotation continuation remain separate.

## Prepare and compare

Prepare the existing current-context endpoint, then POST to `/api/v1/estimating/workspaces/{id}/excel-import/compare` using the existing preview payload: `option_id`, `revision_id`, `basis_hash`, and `file: {name, base64}`. Same-origin, authenticated, private/no-store rules apply. Parsing occurs outside the transaction, with current authority and exact basis rechecked afterwards. All first-save format, reconciliation and E2 scope rules remain mandatory.

Comparison requires an accepted original Excel import for the same estimate/option and workbook_ref. A different workbook identity and a manual-only estimate are refused. The bounded pilot reads at most 100 accepted workbook versions for one option; larger history is explicitly refused for capacity work. Historical evidence requires current access to each retained basis, not merely permission on today's estimate.

The response binds a `comparison_hash` to:

- The exact original upload, validated `proposal.review_hash`, actor, trusted evaluation date, Complete E2 revision/context and current estimate version.
- The current native version/content hash, title, scope, complete lines and independently calculated totals.
- The latest accepted workbook version/hash and its original file identity.
- Added, Changed and Unchanged incoming lines, current PPO values, previous workbook values, proposed values and individual changed fields. Quantity/rates compare by canonical decimal values. Section/source content and include/print changes count; worksheet row movement does not change identity.
- RemovedImported and PPOOnly omissions requiring one explicit Keep or Remove each. Missing, duplicate, unknown or additional decisions cannot silently delete or append anything.

Stable identity is workbook_ref + native option + line_ref. The historical mapping wins even if a key disappeared in an intermediate upload; new keys use a deterministic namespace UUID. Row reorder and reappearance preserve internal identity. A current PPO edit on an imported line is shown as the current value and will be replaced only by a confirmed whole-estimate successor.

## Save

POST `/api/v1/estimating/workspaces/{id}/excel-import/reimport` with the first-save command fields plus:

- `comparison_hash`: the exact comparison just reviewed.
- `changes_confirmed: true`: confirms replacements, including intervening PPO edits and section/source/presentation changes.
- `decisions: [{line_id, action: "Keep" | "Remove"}]`: exactly the set of current native lines absent from the workbook. Array order is normalised for replay.

The original four confirmations remain mandatory: SourceCalculation, Scope, Reconciliation and SourceWarnings. A reason and actor-private operation UUID are required. The command hash includes the source digest, all confirmations, both review hashes and normalised decisions; changed intent cannot reuse the operation ID.

The saved projection contains uploaded lines in workbook order, followed by explicitly kept native lines in their current order. Kept lines are copied exactly. Known old import provenance remains linked through `retained_from`; PPO-only lines have null provenance, with no inferred section, supplier record, include or print choice. The final projection must fit the existing 100-line and 64 KiB native costing limits, including every kept line. No implicit truncation or price adjustment exists.

The source adapter stores and reads back exact revised bytes before the final transaction. Inside that transaction the service rechecks authority, selected Active option, Draft group, E2 scope/context, current estimate, comparison and decisions, then invokes the native costing writer. Version, discovery basis, source-binding inheritance, specialist lineage, immutable revision evidence, audit, receipt and EstimateVersionSaved outbox commit together. A fault rolls back the entire successor. Unreferenced staged originals remain subject to the existing retention policy; there is no destructive cleanup here.

Scope changes need their own Complete E2 revision first. Native price-source inheritance drops bindings when its existing quantity/unit/cost/source/date rule requires it; free text grants no typed provenance. Specialist lineage uses the existing native successor rules. No quotation, issued output, approval, CRM forecast, ERP transaction or handover is mutated.

## Recovery and retained evidence

The existing exact-version import and `/source` endpoints also read successors. The first-save DTO remains unchanged. A successor adds `resolution: {comparison, decisions, projection}`; its `lines` contains incoming workbook mappings, while the projection also identifies kept native lines. The nested proposal and comparison remain the original unrecorded review documents; the outer Imported state and authenticated review identify the accepted operation. Reading a comparison also checks present access to its earlier native version and every referenced workbook basis. Storage keys and provider URLs are never returned.

Identical accepted retries and `/api/v1/operations/{operation_id}` recover the original receipt under current historical edit access, even after another successor or E2 selection change. Recovery precedes parser/storage I/O. Changed intent returns OperationConflict. A fresh stale command returns ExcelImportComparisonChanged; resolve and review again. Permissions are rechecked after source reads and inside saving after external I/O. Historical source/read access and operation recovery do not inherit quote-only permission.

Migration 0096 adds `excel_reimports` and read-only history views. First-save rows, line maps, hashes and 0095 migration bytes are unchanged. Database constraints bind the predecessor, canonical hashes, native projection, stable historical mappings, exact keep/remove set, E2 basis and accepted audit/receipt/outbox; evidence is append-only. There are no seeds, grants or user changes. Code delivery, CI, independent review, owner acceptance and deployment remain separate; see the [execution evidence](../testing/evidence/excel-import-revision/README.md).
