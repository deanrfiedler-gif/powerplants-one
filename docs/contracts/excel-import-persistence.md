---
document_id: PPO-010-EXCEL-SAVE-API
owner: Dean Fiedler - prototype owner
status: Implemented synthetic backend; acceptance open
date: 2026-10-14
versioning: git
---

# Excel Import durable first-save contract

[Decision](../decisions/excel-import-persistence-backend.md), [preview API](excel-import-review.md), [parent specification](excel-estimate-import.md), [execution evidence](../testing/evidence/excel-import-persistence/README.md). Scope: PPO-010 / BC-04, XI-01/03/04 and backend XI-08; existing 78 parent IDs remain intact.

## Commit

POST /api/v1/estimating/workspaces/{id}/excel-import/commit accepts schema_version: 1, operation_id, reason, option_id, revision_id, basis_hash, review_hash, file: {name, base64}, and confirmations containing exactly SourceCalculation, Scope, Reconciliation and SourceWarnings. Confirmation order is immaterial; duplicates, omissions and unknown values fail. The upload uses the same bounded, canonical base64 envelope and private same-origin gateway as preview. No caller-supplied lines or authority flags are accepted.

The server requires current E2 workspace ownership, estimating.read/edit, source context access, selected Active option and an exact Complete discovery revision. It reconstructs the entire review, including the database UTC evaluation date, and compares both hashes. Any error blocks the whole command. Existing costing returns ExcelImportComparisonRequired, preserving prior estimates and all manual lines. A valid first save allocates stable internal line IDs and checks the complete native receiver envelope before storage. A matching explicit E2 NoneDeclared answer and absent workbook scope group projects to the native required narrative “None declared.”; the empty original comparison and typed E2 choice remain unchanged in retained evidence. This is a fixed representation of the declared choice, never an inference from missing data.

The private adapter stores the original under a deterministic namespaced operation UUID; it never uses the filename as a path. Hash and exact readback bytes must match before database mutation. Migration 0095 adds immutable excel_imports and excel_import_lines, including full source/review/section evidence, original source keys, source-to-native line mappings, independent include/print proposals, authenticated confirmations, actor/time and the resulting exact version. Sections and sources stay in the hashed review; membership is additionally checked against every native line. No secret or storage URL is returned.

One native transaction rechecks authority, versions and hashes, creates the first cost version through writeDiscoveryCosting, and records sidecars, audit, receipt and EstimateCreated outbox event. Deferred SQL constraints reject incomplete or inconsistent graphs. Any database failure rolls back the complete import. Stored but unreferenced originals may remain after failure; no unapproved cleanup period or deletion is introduced.

Success returns the standard {receipt, replayed} object. The receipt refers to the native Estimate at version 1. The saved estimate does not automatically prepare, issue or change a quotation. Include/print proposals remain internal evidence for the later quotation continuation.

## Recovery and retained evidence

GET /api/v1/operations/{operation_id} recovers the original actor's receipt under current edit/owner and exact historical-basis access. Replaying the identical commit returns that same receipt and does not reread the source adapter; changed canonical intent conflicts. The file hash is part of the intent, not global duplicate authority. Later selection changes do not invalidate an accepted operation, but permission loss does.

GET /api/v1/estimating/estimates/{id}/excel-import/{versionId} returns Imported, the exact original proposal, authenticated review record, original operation/receipt IDs and all line mappings. The proposal deliberately retains its original ReviewRequired / recorded:false preview fields; the sibling review record and Imported wrapper identify the accepted event without rewriting source evidence. Current internal read access to the retained estimate and discovery basis is required.

GET /api/v1/estimating/estimates/{id}/excel-import/{versionId}/source verifies and downloads the exact original XLSX. Access is checked before and after storage I/O. The response is private, no-store, attachment-only and nosniff. Missing or corrupt bytes fail; a source outage does not rewrite the retained reference or prevent receipt recovery. The evidence endpoint's source_retained field records the reference, not a live availability probe. Quote-only, foreign-company and revoked identities cannot retrieve source, review or receipt evidence.

## Compatibility and boundaries

The parser, 5 MiB compressed / 20 MiB expanded package limits, 100-line and 64 KiB native receiving limits remain. Existing E1/E2 command DTOs, persisted hashes, source snapshots and quotations are unchanged. No new capabilities, grants, seed entries, business identity kinds or paid services are introduced. Reserved migration slots 0093/0094 are not filled by this increment.

Re-import comparison, removals and manual-line choices, customer-safe quote continuation, native page controls, operational Excel/SharePoint readiness and business acceptance remain separate work. This contract supplies no production authorisation.

