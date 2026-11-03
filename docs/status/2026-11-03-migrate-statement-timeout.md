---
title: Migrations get the same 120 s statement bound as seeding
date: 2026-11-03
---

`migrate()` in `scripts/database.ts` now runs `SET LOCAL statement_timeout = '120s'` as the first statement of its transaction, before the advisory lock, as `seed()`, `reset()` and `tests/helpers/recover-schema.ts` already do. Before this, it inherited the pool's 10 s `statement_timeout` from `src/platform/database.ts`, so one long migration statement could be cancelled with PostgreSQL 57014 on a loaded runner. That happened on 3 November 2026 during an integration attempt on pull request #770: `tests/database/document-library.test.ts` ("DK-B09 populated 0088 upgrade…") failed inside `migrate(88)` while creating `ppo.supplier_claims`, although the same test passed on clean `main` in 34 s and the merge changed nothing `migrate(88)` runs. `SET LOCAL` ends with the transaction, so application reads keep their 10 s limit.

Hosted-demo paths: `scripts/demo-database.ts setup` calls `migrate()` once, as an operator command against a new database, not on a request path, so a 120 s bound per statement is acceptable there. `scripts/demo-upgrade.ts` does not call `migrate()`; it applies pending migrations in its own transaction and still inherits the 10 s pool limit. That is the same exposure, left unchanged here because it is the reviewed hosted-demo upgrade path and Dean starts that workflow.

No migration file, migration or seed registry entry, test version list, permission, grant or CI workflow changes.
