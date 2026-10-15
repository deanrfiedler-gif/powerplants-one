# PJ-06 technical/procurement handover execution evidence

Status: implementation and local verification in progress; CI, independent review, human acceptance and deployment remain separate.

Source: `codex/pj06-technical-handover`, stacked on exact R1 `708c6da71ebd32a93ebfd2bdc84a52d3b198fb35` because current main `1552cfbb8efd6cea17438c2af18ba0effa4fc278` lacks that model. Architecture recorded before implementation in commit `d3681ed`. No merge or deployment.

[Contract](../../../contracts/project-specialist-handover.md) · [Decision](../../../decisions/project-specialist-handover.md).

Private runtime and original local failure logs are outside Git in the task-owned `pj06-r2-20261016` scratch directory. A separate disposable `ppo_synthetic_test` cluster uses port 55441 and the application proof uses 3037. Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15 are pinned. Environment files and synthetic session checkpoints are never published.

The first local test attempt overlapped a task-owned PostgreSQL restart and typecheck; it recorded an early failure and a later unchanged 120-second test timeout. The truncated original console output does not establish the first failure's cause. A serial TAP attempt also timed out in `beforeEach(reset)` at 120 seconds, before asserting the new behaviour. Both outputs are retained. The unchanged-main control at `1552cfb` also failed its reset hook with the original 120-second limits (`main-native-control.log`). This establishes a local baseline failure, not its cause. Assertions and deadlines remain unchanged.

The focused opt-in/legacy-command validation unit passed (1/1). New source and test files were formatted. Full database, compiled HTTP, restart, application, documentation, CI and independent review gates remain pending at this checkpoint.

Draft [PR #522](https://github.com/deanrfiedler-gif/powerplants-one/pull/522) initially published `7e1da43f24705696d45924feea9a2287282f7716`. [Original CI diagnostics](original-ci.json) retain the restart-script lint error, unchanged demo upgrade pin and two exact migration-list failures. The corrected lists append only 0104 and preserve every historical ledger expectation; all remaining domain lists and the policy latest-version check were reconciled as well.

Independent review of that original head found the demo admission pin and a source-privacy leak in native line detail ([review](https://github.com/deanrfiedler-gif/powerplants-one/pull/522#pullrequestreview-5541098131)). The candidate now shares a bounded, authority-filtered handover lookup between line detail and register footer, with database and compiled HTTP revocation regressions. The 0104 admission rationale covers nullable exact references, no historical rewrite/backfill/seed/grant and existing runtime privileges. This does not run a hosted upgrade. The migration guard also now uses the native Engineering `project_id`/`opportunity_id` columns rather than service projection aliases. Verification and independent acceptance of these corrections remain pending.

Additional native tests exercise a receipt-write failure after domain changes (exact rollback), explicit specialist continuity after a returned handover, competing distinct operation IDs with one receiver outcome, and non-ASCII canonical payload bytes. Their presence is not a pass claim.

## Corrected local checkpoint

Full pinned TypeScript and ESLint checks passed on `6b646d162e719fe8a22553dcbaa9f1169e50446b`. Independent automated review of that exact head [completed cleanly](https://github.com/deanrfiedler-gif/powerplants-one/pull/522#issuecomment-6204521261); later changes require their own review. The original two review threads remain separately tracked.

Native execution then exposed two concrete fixture/runtime errors: the new material set code `R2` violated the existing letters-only native constraint, and the new trigger called an unavailable `public.digest` function. The fixture now uses `SP`; the guard uses PostgreSQL's existing built-in `sha256(convert_to(..., 'UTF8'))`, matching the native 0103 approach without adding an extension. Original diagnostics remain in `database-reviewfix-01.log` and `fixture-probe.log` outside Git.

With those corrections, `database-corrected.log` records three passes: populated-0103 preservation/repeat-run stability, PJ06-R2-07 rollback/successor/concurrent-decision lineage, and PJ06-R2-03 unaccepted/stale-source refusal. It also records an `ExactDraftUnavailable` failure in the upstream commercial quotation fixture for PJ06-R2-01 and a reset-hook timeout for PJ06-R2-02. The remaining local run was stopped for investigation; this is not a complete native-suite pass. The unchanged-main PJ05-01 commercial control at `1552cfbb8efd6cea17438c2af18ba0effa4fc278` passed with the same pinned runtime, database and original limits (`main-commercial-control.log`), so that exact draft failure has not been established as baseline behaviour. No deadline or assertion was relaxed. Compiled HTTP, actual application/database restart, complete native coverage and exact latest-head CI remain pending.
