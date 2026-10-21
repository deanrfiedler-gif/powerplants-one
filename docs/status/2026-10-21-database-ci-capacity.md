---
title: Native database CI capacity repair claimed
date: 2026-10-21
---

Dean authorised a separate repair for the database-2 job's 90-minute cancellation on Conversations #654. Codex owns `codex/database-ci-timeout`, cut from current main `f13bd157`. The claim covers the native database matrix in `.github/workflows/application.yml`, the existing [retained-suite isolation decision](../decisions/ci-retained-suite-isolation.md), selection/workflow verification and execution evidence. Conversations #654 and Facilities #627 remain separate.

The investigation compares the cancelled exact-source job with passing unchanged main. The repair must preserve every discovered database test, serial execution within each disposable `ppo_synthetic_test`, the existing test/job deadlines and mandatory aggregate. Verification is pending. No application, schema, permission, dependency, deployment or business acceptance is claimed.
