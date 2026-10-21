# CS-08 Site surveys execution evidence

Date: 21 October 2026. Implementation in progress on codex/site-surveys-cs08, draft PR #628. Owner visual review pending; no deployment or business acceptance claimed.

## Source

PPO - Design, Site surveys — accepted; page 1464:2918, notes 1464:4164. Exact frame/capture mapping is in [the page contract](../../../design/development/pages/scope-cs-08.md). Issued icon-free references remain unchanged.

## Verification in progress

Focused survey unit proof: 5 passed. Empty-schema migration from unchanged 0109 to 0114 passed. Populated upgrade, behaviour, full unit suite, current type/lint/build and browser comparisons are still being checked. A previous local run could not connect after the private database port was refused; the isolated cluster was restarted on a free port. A fresh private PostgreSQL cluster also required increased max_locks_per_transaction for the repository-wide reset. These attempts are not passes.

The isolated database is ppo_synthetic_test. Unchanged 0109 fixture seeding hit its existing 120-second limit locally; extended test-only timing completed the baseline fixture seeds. Runtime source timeouts are unchanged.
