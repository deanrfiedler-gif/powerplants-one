---
title: People phone typography CI correction
date: 2026-10-20
---

PR #625's four full browser jobs failed the same new CS-02 assertion: the compact People row measured 86 px instead of the accepted 85 px. The two aggregate checks consequently failed too. Live **PPO - Design**, `1395:151069`, named **People — accepted**, shows top-aligned 20 px name and 16 px preference lines. The implementation now uses that alignment and line spacing; the exact 85 px check remains, with font readiness and line-box checks added.

Current main `0ebb26a3` was integrated before the correction. The [page contract](../design/development/pages/route-people.md) and [verification evidence](../testing/evidence/people-native/README.md) record the source comparison and local database connection limitation. Full CI rerun results remain separate from earlier local passes. No reference, migration, permission, dependency or owner acceptance changes.
