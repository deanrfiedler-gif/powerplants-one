# Estimating review candidate cost

Date: 8 November 2026. Owner: Codex. Scope: Prompt Y, ES-04/05 and EST-03/07/08. [Draft PR #870](https://github.com/deanrfiedler-gif/powerplants-one/pull/870) follows [the diagnostic decision on #866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027). This is synthetic performance and equivalence evidence, not business acceptance or proof of the original CI cause.

## Baseline and method

The preflight checked current main `e67c9ea8dd64055e5d7859eeb3bacc59d575d5c1`: `queue.ts:48–95` contains the candidate query, before per-candidate work at line 98; `context.ts:32–35` supplies discovery/scope/opportunity visibility. The assertion at `estimate-reviews-register.spec.ts:290–292` retains Playwright's default five seconds. No timeout changes.

`scripts/cloud-setup.sh` succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. Its summary reported database ready and browser unavailable. All database work used `ppo_synthetic_test`. The volume harness is [estimate-review-candidate-cost.proof.ts](../../../../tests/database/estimate-review-candidate-cost.proof.ts), an explicit database diagnostic outside the ordinary `*.test.ts` glob. It creates organisations, opportunities, estimates, submissions and quotation release bases through native commands. No bulk SQL inserts substitute for native data creation. Unrelated estimates have distinct organisations and no site/contact; the 26 matching estimates use the browser fixture's existing customer/site/contact. This mix is a controlled scaling experiment, not a reproduction of every CI record.

One warm-up precedes each single measured sample. The reader runs alone; there are no overlapping queue requests. The observer wraps `pg.Client.query`, counting completed statements and summing client-observed database-call duration, including local driver/transport overhead. Wall time includes all reader work. `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` is a separate subsequent execution and supplies server-side plan timings. No clock, deadline, planner setting, JIT setting or database statistics setting is changed. PostgreSQL's normal automatic statistics maintenance remains active.

Reproduce the final comparison in a prepared disposable checkout (the diagnostic command resets only `ppo_synthetic_test`):

```sh
source ../.ppo-tools/env.sh
PPO_COST_COMPARE=1 node --env-file=.env.local --import tsx --test tests/database/estimate-review-candidate-cost.proof.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/estimate-review-candidate-cost.test.ts
```

The diagnostic writes its full statement observations and plans to `work/candidate-cost-paired/`. Do not run another database suite or a build alongside the measurement. Each volume uses the same rows for frozen main and the changed reader, in that order, with a separate warm-up before each. Response equality is asserted at each paired window in addition to the independent authority suite.

Initial unmodified-main measurements, milliseconds:

| Unrelated estimates | Total estimates / release bases | Window offset | Statements | Summed database | Longest statement | Candidate query | Wall |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 128 / 2 | 25 | 356 | 215.281 | 75.433 | 75.433 | 220.603 |
| 100 | 128 / 2 | 0 | 8,708 | 3,201.353 | 66.025 | 66.025 | 3,288.595 |
| 1,000 | 1,036 / 10 | 25 | 356 | 448.567 | 326.350 | 326.350 | 452.139 |
| 1,000 | 1,036 / 10 | 0 | 8,708 | 3,366.923 | 304.456 | 304.456 | 3,444.434 |
| 3,000 | 3,056 / 30 | 25 | 356 | 2,950.045 | 2,814.864 | 2,814.864 | 2,953.394 |
| 3,000 | 3,056 / 30 | 0 | 8,708 | 6,064.066 | 2,806.486 | 2,806.486 | 6,153.940 |

[Baseline JSON](baseline.json) includes exact workspace counts. [Statement groups](statement-groups.json) retain counts/times grouped by SQL SHA-256. The candidate query is the materially growing statement: the continuation's other 355 statements sum to approximately 140 / 122 / 135 ms. The 103 permission calls sum to 35 / 32 / 34 ms, and the 18 opportunity-detail calls to 36 / 27 / 30 ms. These single samples do not establish a latency distribution.

## Plan and bounded change

The [highest-volume original plan](plan-3000-25.json) has an `Append` producing all 3,086 candidates into the CTE, followed by a `CTE Scan` rejecting 3,060 search non-matches. Its estimate scan and correlated opportunity visibility subplan execute across 3,056 estimates. Latest-submission index probes likewise run 3,056 times. The quote branch checks 30 estimates twice for its two capabilities. The 764 generated JIT functions take 2,561.693 ms, including 1,402.543 ms optimisation and 1,110.524 ms emission, within 2,648.545 ms execution; planning takes another 32.016 ms. At 1,000 unrelated estimates, JIT takes 265.222 ms without inlining/optimisation; at 100, JIT is absent. Growing estimated cost crossing JIT thresholds explains the sharp local increase beyond simple row-scan growth.

The change keeps the latest submission/release-basis joins and literal search expression, orders the cheap matching source rows, then evaluates the unchanged visibility expressions before applying the requested window. `OFFSET 0` inside the ordered subquery is an optimiser boundary that removes no row. It prevents the volatile authority predicates from being pushed into the source scan. The outer order and `LIMIT limit+1 OFFSET offset` remain the actual candidate window. Hidden candidates are filtered before they can consume an offset; insufficient authorised matches produce the same short/empty window.

The [same-data rewritten plan](plan-after-3000-25.json) has a sorted source stream feeding a `Subquery Scan` and outer `Limit`. Only 26 estimate authority evaluations execute for this search, and the quotation authority subplan is never executed because all 26 matches are estimates. JIT still exists (572 functions, 192.583 ms) but inlining/optimisation are no longer triggered in this sample. Candidate and continuation times are 312.024 and 477.007 ms; the full-window sample is 246.210 and 3,484.864 ms. Statements remain 356 / 8,708. Shared-buffer hits fall from 137,122 to 20,480; both plans report zero shared reads and zero temporary reads/writes. A preliminary materialised-search-only rewrite still triggered about 2.45 seconds of JIT and was not retained.

This bounds expensive authority work by the searched, ordered prefix needed to find `offset + limit + 1` authorised candidates; it is not a universal constant-time guarantee. Cheap source scans/sorting still depend on workspace volume, and a prefix containing hidden candidates must inspect them to preserve exact offsets. Broad searches, very large offsets and future planner/statistics changes remain performance limits. Both per-candidate passes and partial-window behaviour are byte-identical to main. No migration, index, setting, capability, grant, dependency, API or workflow changes.

## CI volume estimate and limits

Native discovery with `playwright.compiled.config.ts`, desktop project and shard `1/2` places line 273 after 279 entries (including warm-up), consistent with the prompt's approximate test count. Static inspection of preceding specs and their local helper imports finds two `responseHttpFixture` calls in `commercial-continuity.spec.ts`, three submitted estimate fixtures and one `releaseFixture` in the preceding four tests of `estimate-reviews-register.spec.ts`. Those paths contribute six submitted estimates and three release bases; the target adds 26 matching submissions. This establishes at least 32 submitted estimates and three release bases by the target read under successful execution, not 279 estimates. Some earlier specs use mocked routes or create other kinds of records; discovery test count cannot be converted directly into candidate volume.

This static lower bound is not a complete database census: indirect creation/adoption paths, setup stages, all fixtures and their retained permissions/relationships were not replayed here. No database snapshot from the failing CI lane was available. The 100 / 1,000 / 3,000 volumes deliberately test scaling and the planner threshold; they are not claimed as the actual CI count. Original #866 evidence remains: compiled line 273 passed in 27.8 seconds with 3,796 / 3,869 ms continuations; P01–P11 failed in 22.2 seconds with its continuation still running after 5,700 ms. Fresh ready-head durations and request diagnostics are a separate pending gate.

## Equivalence and validation

The [frozen reader](../../../../tests/helpers/estimate-review-queue-main.ts) is main's entire reader with import paths only changed. No helper it calls is edited. [Source hashes](source-hashes.json) bind the changed reader, frozen oracle and two proof entrypoints. The [database comparison suite](../../../../tests/database/estimate-review-candidate-cost.test.ts) exercises three principals, all three sources, literal search on/off and offsets 0, 25 and 100. Its native fixture has 26 visible estimate/quotation pairs and three hidden pairs interleaved in creation/submission order. Two existing synthetic grants are narrowed for the partial principal and restored afterwards; no grant is added. Assertions compare `deepEqual` and `JSON.stringify` after removing only `as_of`, and state explicit row counts, kinds, states, visibility and continuation expectations.

Local `npm run check` passed: Studio coverage, repository lint, typechecking, all 1,437 unit tests and production build. Foundation, prototype, naming and status-source checks passed. All 18 database equivalence cases passed in 350.793 seconds: 54 old/new window comparisons (108 reads), with zero failures, skips or cancellations. The existing `estimating-review.test.ts` suite passed 12/13 cases in 30.710 seconds. Its quotation-rendering case failed with `ExactDraftUnavailable` at `estimating-review-queue-cases.ts:352`; the saved job had `DraftRenderFailed`. Repeating the whole suite with all `src/` bytes verified against unmodified main reproduced the same 12/13 result and exact failure in 30.882 seconds. The candidate rewrite was restored byte-for-byte afterwards. This is a reproduced local environment/main limitation, not a new queue regression; the real-output case remains for CI. The final paired diagnostic also passed; its measurements are below. Claude's one draft-head review, readiness, full CI and the conditional #866 concurrency checks remain separate gates. No review, merge or executed business acceptance is claimed.

## Final paired volume measurements

Single warmed samples on identical data, milliseconds. The full authority suite and build finished before this run. Both readers returned exactly 75 rows at offset 0 and three at offset 25, with `next_offset` 25 then null and `CompleteWindow`; every paired response matched by deep equality and JSON after excluding only `as_of`.

| Unrelated estimates | Offset | Statements before / after | Summed database before → after | Longest before → after | Candidate before → after | Wall before → after |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0 | 8,708 / 8,708 | 3,185.347 → 3,015.735 | 71.612 → 42.327 | 71.612 → 42.327 | 3,277.349 → 3,095.127 |
| 100 | 25 | 356 / 356 | 205.957 → 177.173 | 64.697 → 46.550 | 64.697 → 46.550 | 210.706 → 181.573 |
| 1,000 | 0 | 8,708 / 8,708 | 3,764.046 → 3,559.958 | 331.874 → 250.881 | 331.874 → 250.881 | 3,855.342 → 3,640.181 |
| 1,000 | 25 | 356 / 356 | 408.902 → 379.026 | 293.099 → 225.276 | 293.099 → 225.276 | 411.876 → 382.489 |
| 3,000 | 0 | 8,708 / 8,708 | 6,343.109 → 3,630.815 | 2,853.714 → 287.226 | 2,853.714 → 287.226 | 6,443.081 → 3,720.554 |
| 3,000 | 25 | 356 / 356 | 3,046.600 → 419.621 | 2,911.836 → 305.236 | 2,911.836 → 305.236 | 3,050.531 → 423.616 |

[Paired measurements](paired-measurements.json) retain exact counts. The largest fixture has 3,056 submitted estimates, 30 quotation release bases, 3,056 opportunities and 3,005 organisations. The source hashes bind both readers and the diagnostic.

| Largest-volume continuation plan | Planning ms | Execution ms | JIT ms / functions | JIT inlining / optimisation | Shared-buffer hits |
| --- | ---: | ---: | ---: | --- | ---: |
| [before](paired-plan-before-3000-25.json) | 46.576 | 3,004.031 | 2,867.742 / 766 | True / True | 146,721 |
| [after](paired-plan-after-3000-25.json) | 34.915 | 248.431 | 226.794 / 572 | False / False | 20,480 |

Local browser execution remains **not run**, because cloud setup reports the browser unavailable. Full ready-head CI is **not run**, because this PR remains draft pending Claude’s one review. #866 is not merged into the baseline; its concurrency checks and the diagnostic browser comparison remain conditional integration work. No test assertion or timeout was changed to obtain a pass.
