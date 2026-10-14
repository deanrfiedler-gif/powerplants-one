---
document_id: PPO-010-EXCEL-PERSISTENCE
owner: Dean Fiedler - prototype owner
status: Implementation decision; business acceptance open
date: 2026-10-14
versioning: git
---

# Excel Import durable first save

The user's 14 October instruction authorises Step 3 of the [Excel import plan](../delivery/excel-estimate-import-plan.md): durable workbook storage and atomic estimate saving. This continues [validated review](excel-import-review-backend.md), within PPO-010 / BC-04, EST-02–EST-05, EST-07/08 and DOC-01/02. Existing parent requirements and issued workbook/reference bytes remain unchanged.

## Decision and constraints

Reuse the private document adapter, the current E2 cost-basis writer and native operation receipts. No dependency, framework, service, grant or production integration is added. An exact, validated workbook may create the first Draft estimate for its selected Active, Complete E2 option. Existing estimates require the separately planned revised-workbook comparison; this increment cannot overwrite manual lines or import another whole estimate over them.

The server reconstructs the review from the submitted exact bytes and current context. A new command supplies the reviewed hash, basis hash, original operation UUID, reason and all four explicit confirmations (source calculation, scope, reconciliation, source warnings). Workbook declarations never substitute for the authenticated actor and server time. Changes in bytes, filename, mapping, evaluation date, scope or receiver version invalidate review. No adjustments are introduced. For a matching explicit E2 NoneDeclared choice, the required native narrative is “None declared.”; retain the original empty scope comparison and typed declaration unchanged. Validate the exact native receiver envelope before storing.

Store and read back the exact original before the database mutation transaction. A namespaced storage UUID derives from workspace, actor and original operation, independently of the original filename. Hash and byte equality must verify. Reuse the local private filesystem adapter and configured private hosted blob adapter; operational SharePoint is still outside this prototype. Do not delete staged orphans automatically: retention policy remains unresolved. A failed save may retain private source bytes but cannot leave an estimate, source sidecar, audit, receipt or outbox effect.

One transaction rechecks current authority and basis, writes through the unchanged native cost-basis participant, and saves immutable version-bound review/source and line mapping sidecars, audit, receipt and outbox. Preserve the complete typed review document, sections, source locators, warnings, cached formula evidence and independent include/print proposals. Assign internal line UUIDs to workbook_ref + option + line_ref; row position is provenance only. Deferred database checks bind the exact native version, all lines and evidence to the same company, option, discovery revision and operation.

Identical original-operation replay returns the original receipt under current historical-basis access, even after selection changes. Different intent conflicts. Receipt and source recovery require current internal read/edit authority as applicable; quote-only access cannot retrieve workbook evidence. Source retrieval verifies the retained exact key and hash and never returns a storage URL. Existing E1/E2 DTOs and hash contracts remain unchanged.

Migration 0095 is additive and seedless. Slots 0093–0094 belong to the separate DK-06 publication/use branches; this branch builds on the review PR and preserves those reserved gaps. Reconcile exact ledger assertions and the reviewed hosted-upgrade guard. No alteration of business identities is needed because the operation's record remains the native Estimate.

## Alternatives and remaining work

Storing only the hash cannot recover originals. Client-supplied estimate rows would bypass server review. A second estimate writer would diverge from E2 rules. A durable editable staging subsystem would add lifecycle and cleanup policy beyond the authorised first-save step. These alternatives are not selected.

Step 4 owns revised-workbook comparisons, removal/manual-line choices and successors. Step 5 owns exact-version quotation continuation and include/print application. Native page controls, operational workbook compatibility, business approval and production readiness remain open. Tests must distinguish backend delivery from these obligations; [evidence](../testing/evidence/excel-import-persistence/README.md) records actual execution.
