# PJ-06 technical/procurement handover execution evidence

Status: implementation and local verification in progress; CI, independent review, human acceptance and deployment remain separate.

Source: `codex/pj06-technical-handover`, stacked on exact R1 `708c6da71ebd32a93ebfd2bdc84a52d3b198fb35` because current main `1552cfbb8efd6cea17438c2af18ba0effa4fc278` lacks that model. Architecture recorded before implementation in commit `d3681ed`. No merge or deployment.

[Contract](../../../contracts/project-specialist-handover.md) · [Decision](../../../decisions/project-specialist-handover.md).

Private runtime and original local failure logs are outside Git in the task-owned `pj06-r2-20261016` scratch directory. A separate disposable `ppo_synthetic_test` cluster uses port 55441 and the application proof uses 3037. Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15 are pinned. Environment files and synthetic session checkpoints are never published.

The first local test attempt overlapped a task-owned PostgreSQL restart and typecheck; it recorded an early failure and a later unchanged 120-second test timeout. The truncated original console output does not establish the first failure's cause. A serial TAP attempt also timed out in `beforeEach(reset)` at 120 seconds, before asserting the new behaviour. Both outputs are retained. An unchanged-main control is running against `1552cfb`; no baseline cause is claimed until its result exists. Assertions and deadlines remain unchanged.

The focused opt-in/legacy-command validation unit passed (1/1). New source and test files were formatted. Full database, compiled HTTP, restart, application, documentation, CI and independent review gates remain pending at this checkpoint.
