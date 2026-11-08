---
title: Estimating review candidate cost bounded before the authorised window
date: 2026-11-08
---

[Draft PR #870](https://github.com/deanrfiedler-gif/powerplants-one/pull/870) completes Prompt Y’s local investigation under [the #866 decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027). Native synthetic volume measurements reproduce candidate-query growth and expensive JIT optimisation. The query-only change searches and orders source rows before the unchanged visibility predicates, which still decide membership before the requested window. Both per-candidate passes remain byte-identical to main. No timeout, migration, index, setting, capability, grant, API or workflow change.

In the final paired run on identical data with 3,000 unrelated estimates, continuation wall time falls from **3,050.531 to 423.616 ms** and full-window wall time from **6,443.081 to 3,720.554 ms**. Candidate-query times fall from 2,911.836 to 305.236 ms for the continuation and 2,853.714 to 287.226 ms for the full window. Statements remain 356 and 8,708. These are single warmed local samples, not proof of the original CI database volume or failure cause. [The evidence record](../testing/evidence/estimate-review-candidate-cost/README.md) retains both volume tables, plans, source hashes, the CI-volume lower bound and performance limits.

All 18 frozen-main equivalence cases pass (54 paired windows across three principals, three sources, search on/off and interleaved hidden estimates/quotes). The paired volume diagnostic passes. Studio checks, lint, typechecking, all 1,437 unit tests, production build and documentation checks pass. The existing ES-04/queue suite passes 12/13; its quotation-rendering case fails with ExactDraftUnavailable/DraftRenderFailed and reproduces with the same 12/13 result on unmodified main. No assertion or timeout was weakened.

Claude’s one independent draft-head review precedes readiness. Full ready-head CI and comparison of both line-273 browser lanes remain pending. Cloud setup reports PostgreSQL ready and browser unavailable, so local browser suites are not run and are left to GitHub CI. #866 is not on this baseline; its concurrency tests must run once its change reaches main. No merge, independent review, deployment or business acceptance is claimed.
