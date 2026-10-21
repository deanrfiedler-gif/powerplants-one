---
title: Native database CI capacity repair
date: 2026-10-21
---

Dean authorised a separate repair for the database-2 job's 90-minute cancellation on Conversations #654. Codex owns draft implementation PR #658, `codex/database-ci-timeout`, cut from main `f13bd157` and subsequently integrated with main `8da0762e`. The owner account externally merged documentation-only claim #657 before the workflow repair was pushed; that claim merge is not implementation delivery. The native database matrix now uses eight isolated shards under the existing [retained-suite isolation decision](../decisions/ci-retained-suite-isolation.md#native-database-capacity--21-october-2026). Conversations #654 and Facilities #627 remain separate.

The investigation records the cancelled exact-source job and passing unchanged main, with database-3 already close to its deadline on both sources. The repair preserves every discovered database test, serial execution within each disposable `ppo_synthetic_test`, the existing test/job deadlines and mandatory aggregate. [Execution evidence](../testing/evidence/database-ci-capacity/README.md) distinguishes selection/configuration proof from pending real CI. No application, schema, permission, dependency, deployment or business acceptance is claimed.
