# Excel Import durable first-save evidence

Owner: Dean Fiedler — prototype owner. Review status: implementation evidence; independent review and business acceptance remain open. Date: 14 October 2026.

The [decision](../../../decisions/excel-import-persistence-backend.md) and [contract](../../../contracts/excel-import-persistence.md) continue PR #481 on `codex/excel-import-persistence-backend`. Scope is Step 3 of PPO-010 / BC-04, with XI-01/03/04 and backend XI-08 evidence. No issued reference bytes, original E1/E2 DTOs, grant or seed changes.

## Executed checks

Local execution uses Node 24.21.0, PostgreSQL 16.15 and an isolated loopback `ppo_synthetic_test`. Synthetic originals live outside the repository in the private document adapter. Execution is being completed; the final results below must reflect tool output.

The database proof exercises exact original bytes, all 12 native lines, seven sections, authenticated review and source membership, independent include/print proposals, identical and conflicting original operations, authority loss, stale basis and rejection of existing costing. Storage, readback, estimate-version, sidecar, line-map, audit, receipt and outbox failures must leave the original database snapshot unchanged. A deliberately corrupted line mapping must fail the deferred SQL graph.

The populated-upgrade proof installs the feature over 0025 with an existing estimate and over 0092, preserves original rows and ledgers, checks empty additive tables and repeats migration without effects. The common exact-ledger suites include 0095 while retaining reserved 0093/0094; Products additionally covers installing reserved 0052 after 0095. No new seed or grant is expected.

The compiled HTTP proof exercises authenticated commit, exact source download, retained review, original-operation GET/replay, payload/origin limits and current access denial. The restart script writes a synthetic source and checkpoint before actual application/PostgreSQL restarts, then verifies identical original bytes, native version, sidecars, audit/receipt/outbox rows and replay.

## Corrections during validation

Initial checks found test setup errors: a Windows temporary path used a shortened alias rejected by the existing exact-path document adapter, one fixture edit addressed a nonexistent cell, and strict object comparison treated the parser's null-prototype metadata differently from equivalent persisted JSON. The tests now use the actual resolved private path, real source cell and JSON-value comparison. Type checking also caught a confirmation-array narrowing and route-parameter type, both corrected.

Receiver review identified explicit E2 NoneDeclared scope as a required narrative representation. It projects to “None declared.” in the native version while retaining the original empty workbook comparison and typed E2 declaration; the exact receiver validates before storage. This does not infer absent data or alter the workbook.

## Limits

This is backend delivery. There is no native import UI, revised-workbook comparison or automatic quotation continuation. No assertion grants business approval, validates an external engineering formula or proves operational Excel/SharePoint compatibility. Production migration, deployment and owner acceptance were not performed. Hosted CI and independent review are separate from local checks.
