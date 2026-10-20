---
title: People phone typography CI correction
date: 2026-10-20
---

PR #625's four full browser jobs failed the same new CS-02 assertion: the compact People row measured 86 px instead of the accepted 85 px. The two aggregate checks consequently failed too. Live **PPO - Design**, `1395:151069`, named **People — accepted**, shows top-aligned 20 px name and 16 px preference lines. The implementation now uses that alignment and line spacing; the exact 85 px check remains, with font readiness and line-box checks added.

Current main `0ebb26a3` was integrated before the correction. The [page contract](../design/development/pages/route-people.md) and [verification evidence](../testing/evidence/people-native/README.md) record the source comparison and local database connection limitation. Full CI rerun results remain separate from earlier local passes. No reference, migration, permission, dependency or owner acceptance changes.

At repair commit `53fb1a6a`, all four full browser suites pass the People cases: each desktop suite reports 503 passed / 21 skipped, and each mobile suite 445 passed / 79 skipped. CI also passes 950 unit tests, static/type/build checks, the PostgreSQL shards and other application lanes. The compiled desktop job nevertheless reaches its existing 60-minute job limit after reporting successful tests, leaving its aggregate red; a targeted retry was requested. Unchanged main's corresponding workflow passes, and no test or timeout was weakened. Current main `0909db97` adds claim/reservation records only; its generated-status conflict is resolved through the generator. Exact-run evidence and remaining gate results are distinguished on PR #625. Owner review remains pending.
