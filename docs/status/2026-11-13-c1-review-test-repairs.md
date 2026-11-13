---
title: C1 review findings repaired in tests and diagnostics
date: 2026-11-13
---

[PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905) addresses Claude's C1-5/C1-6 findings at `af06b798` and Dean's shared agreement-fixture follow-up. Connected dates follow the Brisbane execution month and preserve one six-monthly occurrence; the shared agreement retains historical 2026 evidence with a rolling future expiry. Renewal and out-of-term refusal checks derive from that expiry. Browser diagnostics stream bounded allowlisted events to Node before a timeout can close the page. The original CRM journey and 120-second deadline are unchanged.

The [execution chapter](../testing/evidence/agreement-charge-c1/README.md#current-review-fix-checkpoint--13-november-2026) records fresh supported-Chrome verification and source-bound results. Main `c31809470` is merged without conflicts. These corrections change tests and evidence only. Claude already confirmed C1-2/C1-3/C1-4; targeted C1-5/C1-6 confirmation and final-head CI remain separate gates recorded on the PR. Nothing is merged or deployed; Dean owns merges.

The first published correction exposed a race in the new mobile teardown regression: the fixture closed before deferred cancellation sampling ran. The CI event artifact is retained. Both synthetic fixtures now await that browser task before flushing, preserving all assertions and deadlines. The actual-timeout case had passed in CI. Final idle-host units passed 1,455/1,455 after main's 1,450/1,450 control; earlier installer failures remain in the record. Replacement-head CI and the bounded Claude confirmation remain required.
