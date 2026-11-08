---
title: Estimating review queue corrected writer audit stop
date: 2026-11-07
---

Draft [#866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866) resumed under Claude's corrected writer criterion and merged main `5a1c09fd3`. A native synthetic transaction proves a different stop condition: `reconcileTesters` inserts and updates `ppo.users`, a table the queue reads, while holding implicit `FOR KEY SHARE` on the coordinator workspace through `users_workspace_id_fkey`, with no workspace `FOR UPDATE`. Separate probes acquired SHARE and NO KEY UPDATE while UPDATE failed with `55P03`. The writer's two inserted users and its other writes were rolled back. [Evidence, scope and reproduction](../testing/evidence/estimate-review-window-main/writer-audit-stop.md).

The quote worker failure path at `src/estimating/worker.ts:87–93` remains a pre-existing lock-free gap, not a stop condition. Its claim and success transactions hold FOR UPDATE. `worker.ts` is unchanged. The writer audit is partial and stops at the demonstrated key-share writer; no exhaustive inventory is claimed.

The queue still uses FOR UPDATE. Original H1 controlled lock waiting is confirmed; H2 actual browser overlap is unresolved; H3 accumulated-row and H4 date exclusions remain limited to the previously measured fixtures. The 8,708-statement full window remains a separate set-based-reader task. This finding does not attribute the CI failure to the operator transaction.

The native diagnostic passed on PostgreSQL 16.15 after successful cloud setup. No runtime, test, assertion, timeout or workflow change; no new application or browser suite run. Setup reports browser unavailable. SELECT-only proof, complete writer/page request audits, concurrency proof, post-fix comparison and browser diagnostics remain unfinished under the stop condition. Claude must resolve this criterion before implementation; no DONE, completed-build review, ready-head browser evidence, merge or deployment is claimed.
