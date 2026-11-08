# Shared queue lock — draft delivery evidence

7 November 2026. PR [#866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866), [claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6714557257), based on main `5a1c09fd3`. This delivers the draft-stage work in [Claude’s handover](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704440056), under [criterion 2 version 3](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704438201). Independent review and ready-head browser evidence are still required in the [decided order](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6690379898).

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

The retained original baseline was **6,905.969 ms**, including **6,700.027 ms** in the workspace-lock statement. This same-environment control independently reproduces the five-second failure mechanism. There are 131/262 sampled lock waits for the UPDATE second reader/continuation and **zero observed lock waits** for all SHARE calls. Observation counts are not durations. The 0.419 ms is statement wall time, not a claim of an exactly zero-duration execution.

Three sequential samples per mode: full window UPDATE 2,743.550–3,171.850 ms, SHARE 2,685.592–2,899.955 ms; continuation UPDATE 160.841–177.670 ms, SHARE 170.705–183.402 ms. Complete DTO digests, excluding only `as_of`, match across modes for both windows, the overlapping continuation and both Awaiting my review windows. Every full window still performs **8,708 statements**, every one-candidate continuation **356**. The separate set-based queue-reader task remains necessary; this PR does not reduce per-candidate work.

Copy the `.ts.txt` snapshots to ignored `tmp/prompt-s/` with the `.txt` suffix removed, source `/workspace/.ppo-tools/env.sh` after successful cloud setup, then run `node --env-file=.env.local --import tsx tmp/prompt-s/compare-locks.ts`. This adds its synthetic fixtures and refuses other database names. `--reuse` selects its latest 26-estimate fixture for a repeated comparison without adding rows. Raw activity samples remain ignored under `tmp/prompt-s/compare-locks-observations.json`; their SHA-256 is in the retained measurements. `read-catalog.ts` reproduces the read-only catalog capture.

## Browser diagnostics and remaining acceptance

The existing continuation browser case now logs `PPO_REVIEW_QUEUE_REQUEST` JSON for each queue request’s start, finish or failure, with request ID, offset, view, UTC time and elapsed milliseconds. It logs no cookies, query title, bind values or principal identifiers. Every existing assertion and timeout is byte-for-byte retained, and no routing/interception/polling change was made.

| Hypothesis | Current disposition and limit |
|---|---|
| H1 workspace lock contention | Confirmed and corrected for the controlled duplicate-read mechanism. Native mutation exclusion still passes. Does not by itself identify the original CI blocker. |
| H2 actual browser duplicate/overlapping reads | **Open until ready-head CI logs.** The additive diagnostics will confirm or rule out queue overlap in the real failing sequence. Server-injected overlap is not browser evidence. |
| H3 accumulated rows | Earlier eleven-workspace/100-row tests did not reproduce the slowdown; this comparison retains 100 unrelated rows and shows lock-dependent behaviour. Not a reproduction of the full original shard history. |
| H4 date boundary | Earlier UTC/Sydney comparison retained exact DTOs except observation time. Not repeated here; that bounded evidence does not exclude expiring grants or unrelated historical state. |

Local cloud setup succeeded with database ready and **browser unavailable**. `npm run browser:check` confirms Chrome is absent at `/opt/google/chrome/chrome`. No browser suite, rendered quotation regression, ready-head lane duration or all-shards pass is claimed. Those are left to GitHub CI as repository setup guidance requires.

Local validation: 4 new database proofs; 12 selected ES-04/queue regressions; **1,426/1,426 unit tests**; typecheck; focused ESLint; production build; development-register coverage; foundation, naming, status-source, documentation-scope and whitespace checks. Foundation was rerun after all new evidence links existed. No full database/HTTP regression or browser suite was run locally. These checks do not grant visual, owner, operational or production acceptance.

Draft-stage delivery requests Claude’s one independent review. Only after no unresolved defect may the PR become ready. Completion must then report both “P01–P11 browser proof” and “Compiled application browser-desktop-1 proof” durations against the original table, the request logs, and all browser shards. If ready-head evidence shows this does not fix the browser failure, hand over the finding; do not increase a timeout. No merge or deployment.
