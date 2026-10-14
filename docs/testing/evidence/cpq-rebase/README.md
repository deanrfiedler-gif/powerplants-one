# CPQ rebase execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 14 October 2026. Scope BC-04 / ES-02 / ES-03; EST-01–EST-09 preserved. Synthetic implementation evidence, not operational, visual or production acceptance.

## Source and decision

Isolated branch `codex/cpq-rebase` continues governed-cost PR #491 at `16c83b0` and published-Product PR #490. Main was inspected at `bc9e3fb`, including separately merged Excel landed costs #489. Existing worktrees and uncommitted work were inspected and preserved. [Architecture decision](../../../decisions/cpq-rebase-conflicts.md) was committed as `a39837e` before implementation. The workflow envelope is version 1 and reuses immutable run/adoption/audit/receipt contracts; definition schemas 1–4 and old hashes remain intact. No migration, seed, grant, dependency or service is added.

The live amended PostgreSQL definitions were read with `pg_get_triggerdef` and `pg_get_functiondef`. Runs and adoptions use append-only evidence triggers, audit uses its immutable trigger, and receipt recovery remains the existing shared transaction contract. Populated tests snapshot original run/adoption/native version/binding/audit/outbox/receipt rows, the migration ledger and all permission grants before repeated migrate/seed execution. This choice does not infer historical-upgrade correctness from a single new migration: there is no new migration.

## Local verification

Environment: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16; only disposable `ppo_synthetic_test`. Credentials and session-bearing restart checkpoints remain ignored and outside committed evidence.

- Compiled application build: passed, including TypeScript and all routes.
- Pure regression: pending final recorded run; includes all rebase actions, material-before-labour bases, incompatible/missing/colliding targets, schema-3 suppression, manual receiving choices and unrelated-line protection.
- PostgreSQL regression: running. The focused rebase cases cover parent history, current access/company/source checks, manual/native provenance, obsolete removal, private quotation projections, atomic rollback, competing/repeated operations and repeat migration/seeding.
- Compiled HTTP and actual application/PostgreSQL restart: pending.
- Documentation/register assurance, final lint and typecheck: pending.

Initial rebase database execution passed three of five scenarios and exposed two test expectation errors: the existing stale-discovery contract returns `DiscoveryRevisionChanged`, and native saved monetary values are normalized. Assertions were corrected to those contracts; runtime safeguards were not weakened. Final rerun results supersede that initial attempt.

## CI, independent review and acceptance

Local checks are separate from GitHub CI and independent automated review. Both will be recorded against the actual pull-request head; no readiness claim is made while pending. Human operational acceptance, UI controls, representative workloads, live book/compatibility policy, merge and deployment are outside this increment. Existing native one-to-100-line, AUD, unit and sell-not-below-cost contracts remain. All-removal does not create an empty estimate. The next planned backend increment is release quality and impact assessment.
