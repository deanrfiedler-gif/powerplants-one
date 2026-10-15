# DK-03 applicability correction evidence

Owner: Dean Fiedler. Synthetic backend correction, 15 October 2026. Base main `41c8479a0aa4ff8eeebec5efb66712c95ecc8874`; isolated branch `codex/output-applicability`. Decision `81d0741` precedes implementation `e13e603`. [Decision](../../../decisions/output-distribution-applicability.md), [action contract](../../../contracts/output-actions.md) and [programme reconciliation](../../../delivery/backend-reconciliation.md).

## Reproduction and implementation

The new C10 case ran against unchanged main application/database sources and failed with `409 IssueNotApplicable` after native issue, acknowledgement and attendance start. The exact detail had already asserted available bytes and `pack_applicable:true`, with appointment InProgress. The failing log is retained privately, outside Git. Changing the audience predicate from Started to InProgress makes that connected case pass; both preparation and new simulated sending use the same existing audience boundary. No historical record or receipt is rewritten.

The initial C11 test setup attempted a direct scheduling-version update. The native `guard_appointment_change` correctly refused it, before the intended assertion. That retained fixture failure is corrected by using the native appointment move command in C12; no guard, assertion deadline or access check is relaxed. C11 separately proves preparation before native start can be sent afterward. C12 proves the real schedule/crew change invalidates detail and distribution while preserving the original attempt, then permits a historical non-send observation.

## Validation ledger

The [local validation ledger](local-validation.json) binds the implementation, compiled build and SHA-256 hashes of retained private logs. The final implementation builds successfully (including its TypeScript check); full lint and three focused units passed. The initial database run passed C10 and nine existing cases, including original-operation/concurrency, rollback and the populated 0090 upgrade. It is **not a suite pass**: the initial C11 fixture failed and was corrected; C05/B02/B03 reached existing deadlines, then B04/B05 encountered connection failures and the run was stopped. Corrected C11/C12, compiled HTTP and restart remain pending at this checkpoint.

The primary-main control could not load its missing yauzl dependency, before any assertions. A separate clean main worktree at the stated base, using the same freshly installed pinned dependencies, reproduced the 120-second beforeEach timeout for C05 and B02. This supports a local environment limit, without excusing unexecuted coverage. No test deadline, assertion, guard or PostgreSQL durability setting changed. Foundation and naming checks passed before final evidence/registry edits; final CI is still required. Original reproduction, fixture failure and environment-control logs remain private with hashes above; session-bearing checkpoints are never committed.

## Scope and remaining gates

The fix only restores an existing native state to DK-03's synthetic distribution audience. It does not prove real sending/delivery or implement a page. Company/access, exact bytes, current revision/issue, review flag, assignment/schedule versions and recipient authority remain mandatory. Historical unknown/non-send/reconciliation semantics remain unchanged. No migration, seed, grant, framework or dependency is added; therefore no migration-registry or generated-permission contract changes are required. CI, independent automated review, operational ownership and acceptance are separate; no merge or deployment.
