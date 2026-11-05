---
title: Hosted-demo upgrade gets the 120 s statement bound
date: 2026-11-03
---

`upgradeExistingDemo()` in `scripts/demo-upgrade.ts` applies every pending migration and seed in one transaction, which inherited the pool's 10 s `statement_timeout` from `src/platform/database.ts`. One long statement (a DO block or backfill) could therefore cancel the hosted-demo upgrade with PostgreSQL 57014. The transaction rolls back, so no data is lost, but the operator run fails. The transaction now runs `SET LOCAL statement_timeout = '120s'` straight after the optional `SET TRANSACTION READ ONLY` for `verify`, and before the advisory lock. This matches `seed()`, `reset()` and, from #856, `migrate()` in `scripts/database.ts`.

The bound is acceptable for the hosted path. The database operation runs as a manual Azure Container Apps job with `replicaTimeout` 600 and no retries (`infra/azure-demo/ppo_operator.py`), so 120 s per statement stays inside the job's ceiling. The job runs before the web image is updated in `.github/workflows/azure-demo-deploy.yml`, and `SET LOCAL` ends with the transaction, so the web runtime's reads keep their 10 s limit. `SET LOCAL` is not a write, so a `verify` run stays read-only. The `latestMigrationVersion` gate and the checksum and history checks are unchanged.

Checked in a Claude Code cloud workspace on Node 24.21.0 against the disposable `ppo_synthetic_test` database: `tsc --noEmit` and `eslint scripts/demo-upgrade.ts` passed; `tests/unit/azure-demo.test.ts` passed 9 of 9; and the hosted-demo database suites that `azure-demo-check.yml` runs (`tests/demo/database.test.ts`, `upgrade.test.ts`, `scheduling-policy-upgrade.test.ts`) passed 17 of 17. These include the read-only verify refusal, idempotent retries and whole-transaction rollback. They do not reproduce a loaded-runner cancellation. The deploy workflow and the hosted demo were not run, because Dean starts that workflow.

No migration file, migration or seed registry entry, `latestMigrationVersion` gate, test version list, permission, grant or CI workflow changes.
