# Shared queue lock — delivery evidence and CI finding

7 November 2026 delivery, corrected on 8 November 2026. PR [#866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866), [original claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6714557257), originally based on main `5a1c09fd3`. This delivers the work in [Claude’s handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704440056), under [criterion 2 version 3](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704438201). Claude's one independent review and [F1 confirmation](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#pullrequestreview-5815856017) are complete. The [ready-head evidence](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716107293) shows **criterion 7 is not met**; [Claude's decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027) governs the corrected findings and [prompt Y follow-up](#prompt-y-follow-up) below.

## Change and prerequisites

Only `readEstimatingReviewQueue` changes its runtime workspace lock from FOR UPDATE to FOR SHARE. Queue readers no longer serialize one another; native FOR UPDATE mutators remain excluded. All candidate queries, exact-source reads, permission rechecks, DTOs and counts remain intact. Detail/snapshot locks, `useCrmResource`, polling, existing assertions/timeouts and `.github/` are unchanged. So are `scripts/demo-database.ts`, `scripts/demo-reviewer.ts` and `src/estimating/worker.ts`.

- [Read and request audit](read-path-audit.md): enumerated SQL call graph and every register/shell request during the continuation sequence. No remaining overlapping page request holds workspace FOR UPDATE; pre-navigation fixture commands and unopened detail/snapshot routes are distinguished explicitly.
- [Writer inventory](writer-inventory-v3.md): native transaction owners, helpers, script/setup paths and trigger writers, with their workspace lock classes. Records the decision’s accepted demo-user argument, the additive fixture/seed arguments and pre-existing gaps. The live catalog corrected an initial suspicion about ticket drafts: their FKs lock users/receipts, not workspaces; they belong to the no-workspace-lock class.
- [Live catalog](live-read-dependencies.json) and [catalog query source](read-catalog.ts.txt): installed direct workspace FKs and SQL functions writing the read set. This supplements source tracing; an FK to a user does not recursively lock that user’s workspace.
- Original [H1–H4 evidence](README.md), [writer diagnostic](writer-audit-stop.md), `writer-lock-probe.json` and its executable snapshot are retained. The old stop describes the superseded criterion, not the current disposition.

The existing lock-free gaps include quote-worker failure state, legacy ticket-draft updates, existing demo-user active/name updates, synthetic user-name/lease-expiry injections and lock-free setup/grant writes. The decision accepts grant rechecks and unchanged gaps. No serializable-snapshot guarantee or permission to run schema maintenance alongside serving traffic is inferred.

## Executed database proofs

`tests/database/estimating-review-locks.test.ts` passed **4/4** on the original draft in 23.002 s and again with the F1 correction on 8 November 2026 in **31.634 s**, on PostgreSQL 16.15 and Node 24.21.0/npm 11.19.0:

1. A client wrapper permits SELECT-only SQL inside the queue callback and rejects mutating CTEs, multiple statements and sequence mutation. It also rejects every FOR UPDATE, FOR NO KEY UPDATE, FOR SHARE and FOR KEY SHARE clause except the exact statement `SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE`. That statement is asserted exactly once per queue read, three times across this test. Literal rejection cases include workspace and opportunities FOR UPDATE, the other three row-lock strengths on opportunities, and the otherwise allowed statement with NOWAIT appended. Only the transaction wrapper’s BEGIN/COMMIT/ROLLBACK delimiters are allowed separately; exact BEGIN/COMMIT counts and no rollback are asserted. Native manual/history, reviewed cost-source binding, specialist contribution/discovery and prepared quotation branches return nonempty expected rows. Selected table visits are asserted so the test cannot pass with an empty queue. The prepared quotation is Output pending; it needs no renderer. This lock-clause rule corrects F1 from [Claude’s review of 61d41c2b4](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#pullrequestreview-5815678117); the original guard allowed FOR UPDATE and did not establish this stronger property.
2. A second native queue read finishes while the first is paused **after acquiring** its real workspace lock. Different backends and nonempty rows are asserted.
3. A native offset-25 continuation returns three rows/no next window while two native full-window readers each hold their workspace locks. After release, each full reader returns 75 rows and next offset 25. Three distinct backends are asserted. This completion order proves reader compatibility without relying on a timing threshold.
4. A native `saveEstimate` starts during a held queue read. `pg_blocking_pids` identifies that exact reader backend as its blocker; the estimate remains version 1. After release, the mutation commits version 2 and the queue shows Changed basis for SourcePrice.

The barriers in these tests establish ordering, not performance. The timing experiment below contains no injected reader delay. The first test run caught a missing `reviewed: true` field in the **new fixture**; that was corrected and all four reran successfully. Existing behaviour/assertions were not relaxed.

Existing ES-04/queue regression selection also passes **12/12** (37.980 s), using `--test-name-pattern='^(ES04|review)' tests/database/estimating-review.test.ts`. This includes current/historical authority, revocation, own-work, returns, successors, native races, snapshots and 25-candidate continuation. The renderer-dependent “quotation queue …” case is intentionally outside this selection; it is not a local pass.

## Controlled continuation comparison

[Executable comparison](compare-locks.ts.txt) and [retained measurements](shared-lock-measurements.json). Both modes use the same database, 26 native matching manual-line submissions, 100 unrelated native submissions in the coordinator workspace and identical retained ES-04 suite rows. The UPDATE control substitutes **only** the queue’s workspace-lock SQL back to its original form in a diagnostic client wrapper. The SHARE run uses the actual changed runtime. No query, timeout, assertion or fixture differs between modes.

The independent connection samples PostgreSQL activity/blockers every 20 ms. In the UPDATE control, continuation starts after the second full reader is observed waiting behind the first. In SHARE mode it starts after both full readers acquire their compatible locks. An earlier exploratory measurement overlapped compilation; the retained final run was repeated after compilation finished, reusing the exact same fixture. No build/browser/test workload ran alongside this final comparison; the documentation checker was independent of the database. Observation and local scheduling overhead remain included.

| Controlled duplicate sequence | Wall ms | Workspace-lock statement ms | Statements | Rows |
|---|---:|---:|---:|---:|
| UPDATE first full window | 2,680.886 | 0.163 | 8,708 | 75 |
| UPDATE second full window | 5,330.985 | 2,663.114 | 8,708 | 75 |
| UPDATE offset-25 continuation | **5,471.253** | **5,302.005** | 356 | 3 |
| SHARE first full window | 2,807.910 | 0.141 | 8,708 | 75 |
| SHARE second full window | 2,828.183 | 0.476 | 8,708 | 75 |
| SHARE offset-25 continuation | **225.037** | **0.419** | 356 | 3 |

The retained original baseline was **6,905.969 ms**, including **6,700.027 ms** in the workspace-lock statement. This same-environment control independently reproduces a lock-contention mechanism exceeding five seconds; it does not establish the cause of the ready-head CI failure. There are 131/262 sampled lock waits for the UPDATE second reader/continuation and **zero observed lock waits** for all SHARE calls. Observation counts are not durations. The 0.419 ms is statement wall time, not a claim of an exactly zero-duration execution.

Three sequential samples per mode: full window UPDATE 2,743.550–3,171.850 ms, SHARE 2,685.592–2,899.955 ms; continuation UPDATE 160.841–177.670 ms, SHARE 170.705–183.402 ms. Complete DTO digests, excluding only `as_of`, match across modes for both windows, the overlapping continuation and both Awaiting my review windows. Every full window still performs **8,708 statements**, every one-candidate continuation **356**. The separate set-based queue-reader task remains necessary; this PR does not reduce per-candidate work.

Copy the `.ts.txt` snapshots to ignored `tmp/prompt-s/` with the `.txt` suffix removed, source `/workspace/.ppo-tools/env.sh` after successful cloud setup, then run `node --env-file=.env.local --import tsx tmp/prompt-s/compare-locks.ts`. This adds its synthetic fixtures and refuses other database names. `--reuse` selects its latest 26-estimate fixture for a repeated comparison without adding rows. Raw activity samples remain ignored under `tmp/prompt-s/compare-locks-observations.json`; their SHA-256 is in the retained measurements. `read-catalog.ts` reproduces the read-only catalog capture.

## Browser diagnostics and remaining acceptance

The existing continuation browser case now logs `PPO_REVIEW_QUEUE_REQUEST` JSON for each queue request’s start, finish or failure, with request ID, offset, view, UTC time and elapsed milliseconds. It logs no cookies, query title, bind values or principal identifiers. Every existing assertion and timeout is byte-for-byte retained, and no routing/interception/polling change was made.

| Hypothesis | Current disposition and limit |
|---|---|
| H1 workspace lock contention | **Real locally, but not the CI cause in these runs.** The controlled duplicate-read mechanism is reproduced and corrected, and native mutation exclusion still passes. Keep FOR SHARE: it prevents readers blocking each other, including overlapping polling/focus reads. |
| H2 actual browser duplicate/overlapping reads | **Ruled out for this sequence in both ready-head lanes.** Offset 0 finishes before offset 25 starts, including in the failing lane. This does not retrospectively establish the original Prompt S request history. |
| H3 accumulated rows | **Now the leading hypothesis**, under Claude's decision: fixed request cost grows with accumulated workspace data. Earlier eleven-workspace/100-row exclusions were bounded fixtures, not the full shard history. The fit below requires server-side confirmation in prompt Y. |
| H4 date boundary | Earlier UTC/Sydney comparison retained exact DTOs except observation time. Not repeated here; that bounded evidence does not exclude expiring grants or unrelated historical state. |

Original local cloud setup succeeded with database ready and **browser unavailable**. `npm run browser:check` confirmed Chrome was absent at `/opt/google/chrome/chrome`. No local browser suite or rendered quotation regression is claimed. Ready-head CI now supplies the browser results below.

Local validation: 4 new database proofs; 12 selected ES-04/queue regressions; **1,426/1,426 unit tests**; typecheck; focused ESLint; production build; development-register coverage; foundation, naming, status-source, documentation-scope and whitespace checks. Foundation was rerun after all new evidence links existed. No full database/HTTP regression or browser suite was run locally. These checks do not grant visual, owner, operational or production acceptance.

## Ready-head CI and fixed-cost fit

On `5b2fcd2e8667635510c136c8b02e8f366d6f5853`, after F1 confirmation, the line-273 test failed in [P01–P11 browser proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42432571462/job/128584505960) in **22.2 s**, at the unchanged 5,000 ms assertion on line 327 (`Next window`: element not found). It passed in [Compiled application browser-desktop-1 proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42432571411/job/128584501848) in **27.8 s**. Seven of eight browser shards passed; the failing shard had 406 passed / 1 failed, and compiled desktop-1 had 407 passed. The line-235 quotation snapshot test passed in both lanes. **Criterion 7 is not met.** The [completion handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716107293) preserves the Prompt S duration comparison, all shard links/counts and exact `PPO_REVIEW_QUEUE_REQUEST` lines.

The table from [Claude's decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027):

| Lane | Line 273 | Full window, 25 candidates | Continuation, 1 candidate | Overlapping queue reads |
|---|---|---|---|---|
| Compiled desktop-1 | passed, 27.8 s | 6,480 ms; 6,450 ms | 3,796 ms; 3,869 ms | none |
| P01–P11 browser | failed at :327 | 9,074 ms | still running when the 5 s assertion expired, more than 5,700 ms | none |
| Local, shared-lock-results.md | — | about 2,700 ms | about 170 to 225 ms | — |

Both lanes run one Playwright worker (`playwright.config.ts:5–6`); no other test ran alongside this one. In P01–P11, offset 0 finished **498 ms** before offset 25 started. In compiled desktop-1, the gaps were **531 ms** and **598 ms**. P01–P11 has no terminal event for its continuation: the decision's more-than-5,700 ms observation is not a completed request duration or a measured server lock wait.

Fit request time as a fixed cost plus a per-candidate cost. The compiled full-window/continuation pair gives about **0.11 s per candidate on CI**, against **0.10 s locally**, and about **3.7 s fixed per request on CI**, against **0.1 s locally**. P01–P11 implies about **6.3 s** fixed. The candidate query (`src/estimating/review/queue.ts:50–97` on this PR) evaluates `estimateVisibility` (`src/estimating/context.ts:32–35`, including per-row subqueries) over estimates with submissions and quotes with release bases in the workspace, before the outer search filter and window. This fits cost growing with data left by earlier tests regardless of window size. **The fit rests on two samples and is an inference until server-side measurement confirms it.** It does not convert the earlier bounded H3 exclusions into a CI-volume proof.

## Prompt Y follow-up

[Prompt Y — find and bound the Estimating reviews queue's fixed per-request cost, PR #870](https://github.com/deanrfiedler-gif/powerplants-one/pull/870) is running in another Codex session on `codex/estimate-review-candidate-cost`, from main `e67c9ea8`, under [Claude's decision, item 5](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6716124027). Dean supplied the prompt in this chat; the linked draft identifies the follow-up, not a claim that it is complete or reviewed.

Prompt Y first measures full windows and one-candidate continuations at increasing native workspace volumes, reports statement counts, summed database time, longest statement and wall time, and stops for Claude if fixed cost does not grow. It uses `EXPLAIN (ANALYZE, BUFFERS)` to identify growing statements before a bounded query fix. Authority, visibility before LIMIT/OFFSET, search, sort, counts, completeness, offsets and row fields remain exact, backed by a frozen-reader oracle and non-vacuous multi-principal database cases. Per-candidate checks remain unchanged. A migration requires a handover; no new capability, grant, dependency, API shape, workflow or timeout change is in scope. Prompt U is shelved as a later per-candidate performance task, not the fix for this test.

## Main integration and next CI result

Dean's decision, given in chat in Codex's session; no [DEAN] comment: follow Claude's decision, merge main `e67c9ea8`, then correct only this record and the status fragment; let CI run on the new head and report line 273 in both lanes. If it fails, **Claude re-runs that job once**. A second failure means **#866 waits for prompt Y to land**. No code or timeout change.

Main `e67c9ea8dd64055e5d7859eeb3bacc59d575d5c1` merged cleanly into the PR branch. The PR's code/test patch is identical before and after the merge; main's #868 changes are inherited without alteration. Only the two requested records are corrected after that merge. The next CI results will be reported on #866 against the new head, preserving the first-attempt evidence above. #866 is not merged into main; no deployment or merge-readiness claim is made.
