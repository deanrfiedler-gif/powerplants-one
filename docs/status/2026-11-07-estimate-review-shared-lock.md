---
title: Estimating review shared lock delivery and CI finding
date: 2026-11-07
---

Ready PR [#866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866) implements the queue-only FOR SHARE change under [Claude’s criterion 2 version 3](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704438201). [The writer inventory](../testing/evidence/estimate-review-window-main/writer-inventory-v3.md) records every native transaction family, scripts and trigger writers, the accepted new-demo-user argument, non-affecting additive insertions and pre-existing gaps. These include quote-worker failure state, legacy ticket-draft updates, existing demo-user active/name updates and synthetic alias/lease-expiry writes. `scripts/demo-database.ts`, `scripts/demo-reviewer.ts` and `src/estimating/worker.ts` remain unchanged. Detail/snapshot FOR UPDATE, source/permission rechecks, polling, assertions, timeouts and workflows are unchanged by this PR.

[Executed evidence](../testing/evidence/estimate-review-window-main/shared-lock-results.md) shows the controlled continuation falling from 5,471.253 ms (5,302.005 ms workspace-lock statement) with the old lock to 225.037 ms (0.419 ms lock statement) with the shared lock on the same fixture. The original 6,905.969/6,700.027 ms baseline remains retained. Complete DTOs match except observation time. Four new database proofs establish SELECT-only native reads, concurrent readers, continuation behind two full windows and a native mutation still blocked until the reader ends. Twelve applicable existing ES-04/queue tests and 1,426 unit tests pass; typecheck, lint, build and documentation/register checks pass.

**Criterion 7 is not met.** On ready head `5b2fcd2e`, the line-273 continuation test failed in P01–P11 browser proof (22.2 s, at assertion :327) and passed in compiled desktop-1 (27.8 s); seven of eight browser shards passed. [The completion evidence](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716107293) retains both lanes' request logs and all shard results. Claude completed the one review and [confirmed F1 with no defects](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#pullrequestreview-5815856017).

Under [Claude's 8 November decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027), **H1 is a real mechanism reproduced locally, but it is not the CI cause in these runs. H2 is ruled out for this sequence in both lanes. H3 is now the leading hypothesis**: a fixed request cost growing with accumulated workspace data. The decision's comparison is:

| Lane | Line 273 | Full window, 25 candidates | Continuation, 1 candidate | Overlapping queue reads |
|---|---|---|---|---|
| Compiled desktop-1 | passed, 27.8 s | 6,480 ms; 6,450 ms | 3,796 ms; 3,869 ms | none |
| P01–P11 browser | failed at :327 | 9,074 ms | still running when the 5 s assertion expired, more than 5,700 ms | none |
| Local, shared-lock-results.md | — | about 2,700 ms | about 170 to 225 ms | — |

The fixed-plus-per-candidate fit gives about **0.11 s per candidate on CI versus 0.10 s locally**, but **3.7 s fixed per request on compiled CI versus 0.1 s locally**; P01–P11 implies about **6.3 s** fixed. Both lanes use one Playwright worker. This is an inference from two samples, not a server-side measurement; the incomplete P01–P11 continuation has no measured completed duration. Earlier H3 fixture exclusions do not reproduce the full shard's accumulated data; H4's UTC/Sydney equality remains limited to its retained fixtures.

[Prompt Y — find and bound the queue's fixed per-request cost](../testing/evidence/estimate-review-window-main/shared-lock-results.md#prompt-y-follow-up) is running in a separate Codex session. It tests volume growth before attempting a fix, with exact authority and offsets. Prompt U is shelved as a later per-candidate performance task; the **8,708-statement full window** is unchanged.

Dean's decision, given in chat in Codex's session; no [DEAN] comment: follow Claude's decision, merge main `e67c9ea8`, correct only this status fragment and `shared-lock-results.md`, and let CI run on the new head. Report line 273 in both lanes. If it fails, Claude re-runs that job once; a second failure means #866 waits for prompt Y to land. No code or timeout change.

Main `e67c9ea8` merged cleanly into the PR branch; the PR's code/test patch is unchanged. The new head's CI outcome belongs in the PR completion comment and does not erase the first-attempt failure above. Original local setup reported PostgreSQL ready and browser unavailable; full database/HTTP, rendered quotation and browser suites were not run locally. #866 remains open; no merge into main, deployment, visual or operational acceptance is claimed.
