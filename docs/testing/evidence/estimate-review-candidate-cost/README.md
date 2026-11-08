# Estimating review queue: transaction-local JIT control

Date: 8 November 2026. Owner: Codex. Scope: Prompt Y, ES-04/05 and EST-03/07/08. [PR #870](https://github.com/deanrfiedler-gif/powerplants-one/pull/870) follows [the original diagnostic decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027) and [Claude’s subsequent JIT-off decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/870#issuecomment-6716621588). This is synthetic performance and equivalence evidence, not business acceptance or proof of the original CI database census.

## Final implementation

The reader adds exactly `SET LOCAL jit = off` before its candidate query, with the existing explanatory comment from `src/shared/organisation-register.ts:85–89`. `src/shared/sites.ts:86` uses the same transaction-local setting. The candidate SQL, authority before LIMIT/OFFSET, both per-candidate passes, partial-window behaviour and returned fields remain byte-identical to main `e67c9ea8dd64055e5d7859eeb3bacc59d575d5c1`. This adds one statement per successful read. PostgreSQL restores the setting on commit or rollback before the connection returns to the pool; it changes no persistent database configuration.

The optional ordered-source rewrite is **dropped**. JIT-off alone produced a 296.123 ms one-candidate continuation at 3,000 unrelated estimates in the preliminary same-data check, below Claude’s approximately one-second reversal condition. A higher-volume comparison is not needed to retain an optional rewrite that is not retained. The earlier [ordered-source experiment](ordered-rewrite.md), its plans, tables and source bindings remain clearly labelled historical evidence for commit `183d9a722`.

No migration, index, capability, grant, dependency, API, workflow, browser assertion or timeout change. The final diff at runtime consists of the setting and four comment lines.

## Diagnosis and plan evidence

The preflight verified current main’s candidate CTE/window at `queue.ts:48–95`, per-candidate work from line 98, and discovery/scope/opportunity visibility at `context.ts:32–35`. The line-273 browser test retains its default five-second continuation assertion. Both browser lanes use one Playwright worker.

The initial main-reader volume run confirmed growth: with 100 / 1,000 / 3,000 unrelated native estimates, continuation wall times were 220.603 / 452.139 / 2,953.394 ms, at 356 statements throughout. Candidate-query times were 75.433 / 326.350 / 2,814.864 ms. [Baseline JSON](baseline.json) retains both continuation/full-window measurements and workspace counts. [Statement groups](statement-groups.json) show the other 355 continuation statements summing to approximately 140 / 122 / 135 ms; no other material volume-related increase was observed in these single samples.

At the highest volume, the [original EXPLAIN plan](plan-3000-25.json) has an `Append` producing 3,086 candidates, then a `CTE Scan` rejecting 3,060 search non-matches. Estimate and latest-submission scans and correlated opportunity visibility checks run across 3,056 estimates; quote visibility runs over 30 release bases. JIT generates 764 functions and spends 2,561.693 ms, including 1,402.543 ms optimisation and 1,110.524 ms emission, within 2,648.545 ms execution. Planning takes 32.016 ms. At 1,000 unrelated estimates JIT takes 265.222 ms without inlining/optimisation; at 100 there is no JIT section. The large local jump is dominated by compilation after the estimated cost crosses JIT thresholds.

Both workflow service declarations use PostgreSQL 16.15. The local server reports `jit=on` and `jit_above_cost=100000`. The final local setting deterministically removes JIT compilation from this reader transaction; it does not depend on the estimated cost remaining below a threshold. Source-row/visibility work still grows with workspace volume, and this is not a universal constant-time guarantee.

## Fixture and measurement method

`scripts/cloud-setup.sh` succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. It reports database ready and browser unavailable. Every database run uses `ppo_synthetic_test`.

The [explicit database diagnostic](../../../../tests/database/estimate-review-candidate-cost.proof.ts) is outside the ordinary `*.test.ts` glob. It creates 100 / 1,000 / 3,000 unrelated estimates through native organisation, opportunity, estimate and submission commands. It also creates 26 matching submitted estimates and 2 / 10 / 30 quotation release bases through the native reviewed-estimate/quote/release commands. Unrelated estimates have distinct organisations and no site/contact; the matching estimates use the browser fixture’s customer/site/contact. No bulk inserts substitute for native creation.

At each volume it measures frozen main and JIT-off alone on the **same data**, with search on and off, at offsets 25 and 0. A separate warm-up precedes each single measured sample. There are no concurrent reads, builds or database suites. The observer counts completed `pg.Client.query` calls and sums client-observed database-call time, including local driver/transport overhead. Wall time covers the full reader. EXPLAIN is a separate execution **inside a transaction with the corresponding JIT setting**, so the after plan correctly observes JIT-off rather than the restored pooled default. Each result records whether EXPLAIN has a JIT section and asserts that after plans have none.

Search windows return 75 then three rows, `next_offset` 25 then null, and `CompleteWindow`. No-search windows contain the latest native mixed source records, so offset 25 is another full candidate window, not the one-candidate searched continuation. Those results must be non-empty and retain their next offset. Every before/after result matches by deep equality and JSON after removing only `as_of`. Every after read must execute the exact setting once and exactly one more statement than main. PostgreSQL’s automatic statistics maintenance remains active; these are warmed single samples, not a latency distribution.

Reproduce in a prepared disposable checkout (the diagnostic resets only `ppo_synthetic_test`):

```sh
source ../.ppo-tools/env.sh
PPO_COST_COMPARE=1 node --env-file=.env.local --import tsx --test tests/database/estimate-review-candidate-cost.proof.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/estimate-review-candidate-cost.test.ts
```

The diagnostic writes observations and plans under `work/candidate-cost-jit-off/`. [Source hashes](source-hashes.json) bind the final reader, frozen oracle and proof entrypoints.

## Authority, transaction and CI limits

The [frozen main reader](../../../../tests/helpers/estimate-review-queue-main.ts) changes import paths only; no helper it reaches is edited. The [database suite](../../../../tests/database/estimate-review-candidate-cost.test.ts) compares three principals, all/estimates/quotations, search on/off and offsets 0/25/100 over 26 visible estimate/quotation pairs and three hidden pairs interleaved in order. It asserts explicit counts, kinds, states, visibility and continuation. Two existing synthetic grants are narrowed and restored; none is added. Additional tests observe the same pooled connection before the setting, during the candidate query and after commit or an injected rollback, proving exact-once execution, JIT off during the query and restoration to on before release.

Native Playwright discovery places line 273 after 279 entries in desktop shard 1, including warm-up. Static inspection identifies two preceding `responseHttpFixture` calls, three submitted estimate fixtures and one `releaseFixture`: at least six submitted estimates and three release bases before the target adds 26 estimates. This is a **lower bound of 32 submitted estimates / three release bases**, not 279 estimates or a complete CI census. Indirect creation/adoption paths, other setup stages and all retained permissions/relationships were not replayed. The scaling volumes are not claimed as the actual CI counts.

The original #866 evidence remains: compiled line 273 passed in 27.8 seconds with 3,796 / 3,869 ms continuations; P01–P11 failed in 22.2 seconds with the continuation still running after 5,700 ms. Fresh ready-head durations and request diagnostics remain a separate gate.

## Post-review main integration and CI diagnostic

Claude's [one independent review](https://github.com/deanrfiedler-gif/powerplants-one/pull/870#pullrequestreview-5816561228) found no defects on `062c0777`. Its [completed ready-head suites](https://github.com/deanrfiedler-gif/powerplants-one/pull/870#issuecomment-6717801511) nevertheless failed the original line-273 test in P01–P11 (22.4 s), while compiled desktop-1 passed (30.3 s). **JIT-off does not fix that CI failure.** The measured production-volume benefit remains; low-volume plan instability is a hypothesis for the CI cost, not an established cause.

After #866 and #869 merged, current main `1672c0629` was merged into #870 without rebasing or conflicts. The queue retains #866's FOR SHARE lock. Its SELECT-only guard now exempts exactly `SET LOCAL jit = off`, checks it once per queue read, and rejects altered settings or appended SQL/comments. Every other guard rule and the three concurrency cases remain unchanged.

Under [Claude's diagnostic decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/870#issuecomment-6717638944), only the original line-273 continuation test gets an `afterEach` diagnostic, including after assertion failure. It reuses the principal returned by the test's existing coordinator login and its search, then calls the native reader at `awaiting_me`, offset 25. A temporary Node-side client wrapper records statement durations and row counts (or a safe error code for rejected statements) and is restored in `finally`. One `PPO_REVIEW_QUEUE_DIAGNOSTIC` JSON line reports the five slowest statements by whitespace-normalised SHA-256 fingerprint, table statistics for all ten named tables, and `SHOW jit` after the read. The slowest read is separately replayed using its own parameters inside a JIT-off transaction for `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, reporting its fingerprint, JIT setting, execution/planning times, JIT presence, shared-buffer hits and the 15 plan nodes with highest time multiplied by loops (including actual rows/loops and tree paths).

Only safe summary fields are logged: no SQL, bind values, titles, raw plans or error messages. Diagnostic errors become safe codes in that same line; missing setup is explicitly skipped. EXPLAIN is a subsequent execution, not the measured request's original plan. Statistics can change between observations. The hook runs after browser assertions and does not change requests, routes, polling, assertions or timeouts. #866's `PPO_REVIEW_QUEUE_REQUEST` listener stays unchanged. Both required lanes' first-attempt logs and full-suite results will be reported in the PR completion reply, requesting Claude's confirmation of these two changes only.

Dean's decision, given in chat in Codex's session; no [DEAN] comment: merge current main (merge, no rebase), make the exact guard exemption and exact-once check, add Claude's log-only diagnostic, push, let full suites run, report both required lanes' request/diagnostic lines, and reply for Claude's confirmation. No assertion or timeout change.

Local integration validation and any limits are recorded in the [follow-up status fragment](../../../status/2026-11-08-estimate-review-queue-diagnostic.md). No merge into main, deployment or business acceptance is claimed.

## Final JIT-off-only measurements

Single warmed samples, milliseconds. Every after result matched frozen main except `as_of`; each adds exactly one setting statement. The source fixture is identical within each pair.

### Search matching 26 estimates

| Unrelated estimates | Offset | Statements before → after | Summed database before → after | Longest before → after | Candidate before → after | Wall before → after | EXPLAIN has JIT before → after |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | 0 | 8,708 → 8,709 | 5,648.162 → 5,397.686 | 2,412.271 → 2,281.416 | 2,412.271 → 2,281.416 | 5,745.057 → 5,485.619 | No → No |
| 100 | 25 | 356 → 357 | 2,450.045 → 2,487.068 | 2,301.101 → 2,349.367 | 2,301.101 → 2,349.367 | 2,454.969 → 2,491.958 | No → No |
| 1,000 | 0 | 8,708 → 8,709 | 3,364.934 → 3,390.008 | 330.630 → 70.329 | 330.630 → 70.329 | 3,445.000 → 3,475.634 | Yes → No |
| 1,000 | 25 | 356 → 357 | 429.638 → 208.726 | 298.193 → 65.389 | 298.193 → 65.389 | 433.095 → 212.723 | Yes → No |
| 3,000 | 0 | 8,708 → 8,709 | 6,339.360 → 3,443.283 | 2,813.972 → 154.722 | 2,813.972 → 154.722 | 6,431.281 → 3,526.341 | Yes → No |
| 3,000 | 25 | 356 → 357 | 3,109.436 → 260.464 | 2,969.674 → 121.138 | 2,969.674 → 121.138 | 3,113.388 → 266.330 | Yes → No |

### No search: mixed native sources

| Unrelated estimates | Offset | Statements before → after | Summed database before → after | Longest before → after | Candidate before → after | Wall before → after | EXPLAIN has JIT before → after |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | 0 | 7,545 → 7,546 | 2,945.683 → 3,022.053 | 71.207 → 65.712 | 71.207 → 65.712 | 3,071.764 → 3,159.518 | No → No |
| 100 | 25 | 6,883 → 6,884 | 2,658.140 → 2,697.353 | 67.353 → 66.401 | 67.353 → 66.401 | 2,739.219 → 2,776.188 | No → No |
| 1,000 | 0 | 9,531 → 9,532 | 4,153.072 → 3,710.654 | 318.956 → 55.516 | 318.956 → 55.516 | 4,429.708 → 3,982.601 | Yes → No |
| 1,000 | 25 | 6,883 → 6,884 | 2,716.964 → 2,544.633 | 317.494 → 56.201 | 317.494 → 56.201 | 2,785.598 → 2,618.066 | Yes → No |
| 3,000 | 0 | 11,113 → 11,114 | 7,583.911 → 4,987.751 | 2,900.046 → 129.997 | 2,900.046 → 129.997 | 7,986.865 → 5,407.149 | Yes → No |
| 3,000 | 25 | 9,273 → 9,274 | 6,443.804 → 4,251.852 | 2,884.586 → 134.439 | 2,884.586 → 134.439 | 6,687.184 → 4,525.180 | Yes → No |

[Machine-readable measurements](jit-off-measurements.json) retain all exact counts, observed JIT settings and EXPLAIN execution times. The largest fixture has 3,056 submitted estimates, 30 quotation release bases, 3,056 opportunities and 3,005 organisations.

| Largest-volume offset-25 plan | Planning ms | Execution ms | JIT ms | Shared-buffer hits |
| --- | ---: | ---: | ---: | ---: |
| [Search, before](jit-off-plan-before-3000-search-25.json) | 28.807 | 2,835.929 | 2,748.229 | 137,257 |
| [Search, after](jit-off-plan-after-3000-search-25.json) | 29.749 | 96.410 | 0.000 | 137,257 |
| [No search, before](jit-off-plan-before-3000-all-25.json) | 30.383 | 2,882.812 | 2,758.937 | 146,808 |
| [No search, after](jit-off-plan-after-3000-all-25.json) | 28.910 | 130.666 | 0.000 | 146,808 |

## Final validation

- [All 20 database cases passed](jit-off-equivalence-results.txt): 18 authority/equivalence cases (54 paired windows) plus exact-once/same-client JIT restoration on commit and injected rollback.
- [The final volume diagnostic passed](jit-off-volume-results.txt) all 24 samples and 12 paired response comparisons, including search and no search; every JIT-off EXPLAIN lacks a JIT section.
- `npm run check` passed on JIT-off alone: Studio, lint, typecheck, 1,437 unit tests and production build. Documentation, migration numbering and source-scope checks are reported on the final PR head.
- The existing ES-04/queue rendering failure is classified in the [final regression log](jit-off-regression-results.txt) and PR comment. The [earlier regression evidence](regression-results.txt) includes the unmodified-main reproduction. The baseline unmodified-main run produced the same failure; no assertion or timeout was weakened.
- Local browser suites: not run, because cloud setup reports browser unavailable. These original implementation results precede the completed ready-head CI and follow-up integration described above.

## Observed low-volume plan instability

The final 100-record searched samples are slower than the initial baseline and show no improvement from JIT-off. Their offset-25 EXPLAINs have no JIT section: nested-loop work executes the latest-submission lookup 2,097,152 times, with 5,265,853 shared-buffer hits. The later after/full-window EXPLAIN changes to a much cheaper plan (33.932 ms execution and 51,638 hits), after the measured read had already taken 5,485.619 ms. EXPLAIN is a separate execution, so its plan and duration must not be represented as the exact measured read. Automatic statistics maintenance was active; this run did not capture statistics timestamps and does not establish why the plan changed. No sample was discarded or rerun to replace it. These observations limit any claim that JIT-off alone bounds all planner/row-work costs.

Retained low-volume plans: [before continuation](jit-off-plan-before-100-search-25.json), [after continuation](jit-off-plan-after-100-search-25.json), [before full window](jit-off-plan-before-100-search-0.json), [after full window](jit-off-plan-after-100-search-0.json).
