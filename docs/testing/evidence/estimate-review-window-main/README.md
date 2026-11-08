# Estimating review window investigation — 6 November 2026

Current continuation: [criterion 2 version 3 writer inventory](writer-inventory-v3.md), [read/request audit](read-path-audit.md) and [shared-lock results](shared-lock-results.md). Claude’s version 3 decision supersedes the earlier unconditional key-share stop; historical measurements and diagnostic bytes below remain retained.

7 November continuation: [corrected writer audit stop](writer-audit-stop.md) records an executed implicit-key-share counterexample after merging main `5a1c09fd3`. The historical reproduction below is unchanged; no runtime fix has been made.

This is a reproduction and handover for [draft PR #866](https://github.com/deanrfiedler-gif/powerplants-one/pull/866), not a delivered fix. The [resumed claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6688592056) follows [Claude's evidence correction](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6688560871). The [Codex decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6688889425) records the stop boundary and rejected alternatives.

## Finding and limit

On unmodified main application code, two full-window reads ahead of a continuation reproduce a **6,905.969 ms** offset-25 read. Its workspace-lock statement takes **6,700.027 ms**. Each full window issues **8,708 statements**; the continuation issues **356**. PostgreSQL observations identify the blocking transactions and `Lock/transactionid` waits. This establishes a mechanism that exceeds the browser's five-second continuation assertion without a wrong result, injected delay or timeout change.

It does **not** establish that those two reads occurred in either original CI failure. No browser was available and the retained artifact bytes could not be retrieved locally. The original CI trigger and root cause remain unresolved. In particular, an intentionally overlapping server experiment cannot establish a client request history. Prompt S's demand to confirm or rule out every hypothesis for the original failure is not met.

The measured full-window cost falls within Prompt S's step-5 handover boundary; no set-based queue rewrite, lock change or speculative client correction was made. `src/`, tests and `.github/` remain identical to main. No assertions or timeouts changed.

## Source and method

- Main: `78fe5732b88a93bb16f1e5ce820fe2828112bbb4`; tree `084513911de29f5cd62756ca1bcc6ba6554e625f`. Its tree equals #707 head `8a15b2e9f2fb8841436622ec2b9bc8a5ecc73d70`. Initial claim commit `ea22dec74d6ba92a24cdc32b059f0e75bfed6349` changes no files. All application experiments ran against that unchanged tree.
- Main's `scripts/cloud-setup.sh` succeeded: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 ready; browser unavailable. Every database procedure checks `ppo_synthetic_test`. No hosted or operational data was used.
- Created the browser test's 26 matching, manual-line submissions through native opportunity, estimate and submission commands as the synthetic coordinator. All 26 share a unique search title. No database reset was used.
- Instrumented `pg.Client.query` only in an ignored diagnostic harness, using `AsyncLocalStorage` to count and time statements per queue call. Query bind values, session tokens and connection strings are not retained. An independent connection sampled `pg_stat_activity`, `pg_locks` and `pg_blocking_pids` every 20 ms. Observations add overhead; these wall times are not CPU measurements or CI timings.
- Ran three sequential offset-0/offset-25 pairs, a controlled overlapping pair, and both `awaiting_me` windows per phase. The overlap starts offset 25 only after the first read acquires the workspace lock. The duplicate experiment additionally observes the second offset-0 read blocked before starting offset 25.
- Applied the Engineering `beforeEach` pattern to eleven isolated workspaces: connection, company, two users, the same capability lists, sessions, native customer/site commands, then removal of the temporary grants. All retained business rows remain in their own workspaces. This reproduces the setup/retention pattern, not all eleven browser test bodies. The harness creates a session for each actor; individual browser cases may create further sessions.
- Separately added 100 unrelated native submissions in the coordinator's workspace and repeated the same measurements against the original 26 matching submissions. This is a bounded earlier-state comparison, not a replay of the entire shard's database.
- Compared Node and PostgreSQL timezones UTC and Australia/Sydney. PostgreSQL reported 6 November 2026 and 7 November 2026 respectively. All four DTO hashes match across the dates after removing only `as_of`. Expected item counts, continuation and completeness were asserted separately. This does not simulate expiring grants or all historical shard data.
- Instrumented runs count application statements including BEGIN/COMMIT. Later phases set the connection timezone immediately before BEGIN; that diagnostic setup query and observer queries are excluded from the application statement count. The initial baseline did not add timezone setup. No artificial delay was added to the reader.

Every full `all` window asserted 75 items, kinds Completeness/SourcePrice/Technical, state Pending, own-work true, decision eligibility false, CompleteWindow and next offset 25. Every continuation asserted three items and no next offset. `awaiting_me` asserted zero items while preserving the same continuation boundary. The date comparison additionally compares complete DTO content, excluding only observation time.

## Measurements

Ranges below are three sequential samples, in milliseconds. Every offset-0 sample issued 8,708 statements and every offset-25 sample issued 356.

| Phase | Offset 0 | Offset 25 |
|---|---:|---:|
| Initial 26-submission baseline | 3,713.190–4,666.191 | 178.249–231.444 |
| Before eleven Engineering fixtures | 3,701.892–4,127.308 | 189.458–192.060 |
| After eleven Engineering fixtures | 3,610.490–4,069.933 | 173.761–194.966 |
| Sydney next calendar date | 3,440.355–4,599.484 | 164.601–222.781 |
| Before 100 unrelated submissions | 3,556.040–5,048.697 | 182.561–237.140 |
| After 100 unrelated submissions | 3,352.082–3,430.770 | 164.042–182.264 |

Single overlapping pairs made the continuation take 3,786.687 ms initially, 4,038.301 ms after the eleven-workspace pattern and 3,927.658 ms with Sydney's date. These samples demonstrate blocking but do not by themselves exceed five seconds.

| Controlled duplicate experiment | Wall time (ms) | Workspace-lock statement (ms) | Statements | Items |
|---|---:|---:|---:|---:|
| First offset 0 | 3,607.813 | 0.231 | 8,708 | 75 |
| Second offset 0 | 6,735.942 | 3,602.106 | 8,708 | 75 |
| Offset 25 | 6,905.969 | 6,700.027 | 356 | 3 |

The second full read's wall time includes its wait for the first. Do not sum those wall times as execution cost. The marginal application statement count is `(8708 - 356) / 24 = 348` per additional candidate. The initial full-window sample includes 2,503 permission queries and 450 opportunity queries. Its one-candidate continuation includes 103 permission queries and 18 opportunity queries. The candidate-selection query itself, measured after Engineering retention, planned in 39.689 ms and executed in 2.215 ms, returning one row without JIT; it was not a five-second scan in this fixture.

Source correspondence: [queue.ts](../../../../src/estimating/review/queue.ts) takes the workspace `FOR UPDATE` at lines 39–41, expands candidates from line 98 and repeats exact-source reads from line 225. [reads.ts](../../../../src/estimating/review/reads.ts) loads current and historical bases, review authority, and final basis rechecks at lines 19–31 and 75–76. Those nested reads account for the repeated work; they also enforce authority and consistency, so removing them requires separate proof.

## Hypotheses

| Hypothesis | Result supported by this evidence | Original CI disposition |
|---|---|---|
| H1 workspace lock wait | Confirmed in controlled overlap. Offset 25 waits on the coordinator workspace behind offset-0 transactions; PostgreSQL reports blockers and an ungranted transaction lock. | Plausible mechanism; the original blocking transaction was not captured. |
| H2 overlapping/duplicate client reads | Controlled duplicate queue calls reproduce a continuation beyond five seconds. `useCrmResource` defaults `serializeReads=false`, loads on focus/15-second intervals and only discards results on cleanup (`crm-state.ts:11,24,61–66`); the register supplies only `(request, true)` (`estimate-reviews-register.tsx:124`). | Neither confirmed nor ruled out. This source possibility and server injection do not prove actual browser overlap. |
| H3 accumulated rows | The eleven-workspace fixture pattern and 100 unrelated same-workspace submissions did not slow sequential continuation beyond 240 ms. | Ruled out for these two bounded expansions; the complete earlier shard state was not reproduced. |
| H4 Sydney midnight | UTC 6 November 2026 and Sydney 7 November 2026 produce identical DTOs apart from `as_of`, including 75/3 `all` rows and empty `awaiting_me` rows. Timings remain comparable. | Ruled out for the reproduced fixture's date boundary; no claim about other expiring state. |

## Original CI evidence

The GitHub connector returned logs for all six jobs below. These are historical outcomes, not checks on a proposed fix.

| Source | Application browser job | Duration/result | Compiled desktop-1 job | Duration/result | Position |
|---|---|---|---|---|---:|
| `a53e39ff` | 127869633827 | 14.2 s / pass | 127869634257 | 18.2 s / pass | 269 |
| `8a15b2e9` | 127883994012 | 31.4 s / pass | 127883975553 | 22.4 s / pass | 280 |
| `78fe5732` | 127920853916 | 22.5 s / fail at line 292 | 127920855311 | 34.4 s / fail at line 301 | 280 |

Both failing jobs report 406 passed and one failed. The other four tests in the file take 3.0–6.6 seconds across these logs. The passes finish before 13:00 UTC and the failures after it; correlation is not a date-causation proof.

Artifacts 13507766541 and 13508622201 retain screenshots and error-context snapshots, not traces. Both workflows explicitly exclude `**/trace.zip`. The connector returned a ZIP reference for compiled artifact 13507766541, but the byte download returned HTTP 403. Its archive contents and the screenshot were not inspected locally. No original trace is claimed, and no workflow was changed. Fresh browser reproduction and `--trace on` were not run because setup reports the browser unavailable; browser suites remain with GitHub CI.

## Retained evidence and reproduction

- [measurements.json](measurements.json): per-call wall time, counts, timings grouped by statement fingerprint, wait-event counts and representative actual blocking rows. Event counts are observations, not wait durations. Lock-query durations provide the wait-time measurements.
- [statements.json](statements.json): the 27 distinct application SQL templates, without parameter values.
- [dates.json](dates.json): actual dates, timezones, item counts, timing and DTO digests.
- [candidate-plan-summary.json](candidate-plan-summary.json): measured selection-plan summary. The full plan remains in ignored local evidence.
- [reproduce.ts.txt](reproduce.ts.txt), [date-probe.ts.txt](date-probe.ts.txt), [explain.ts.txt](explain.ts.txt): diagnostic source snapshots. These are evidence, not installed application utilities or new test-suite entries.

From this checkout after successful cloud setup, copy the snapshots into ignored `tmp/prompt-s/` with their `.txt` suffix removed. Source `/workspace/.ppo-tools/env.sh`, then run each using `node --env-file=.env.local --import tsx`: `reproduce.ts`, `reproduce.ts --engineering`, `date-probe.ts` or `explain.ts`, and `reproduce.ts --accumulated`. The committed execution order was baseline, Engineering, explain, accumulated, date probe. The next-calendar-day date assertion requires UTC and Sydney to be on different dates, as they were for this execution; at another time, report that condition rather than changing the host clock. The accumulated phase requires baseline output. Repeating a fixture phase adds more synthetic rows, so use a fresh disposable setup for a comparable series.

Raw per-statement timings and observer samples remain under ignored `tmp/prompt-s/` (about 178 MiB). Their SHA-256 digests are in `measurements.json`; the committed aggregate preserves every statement count and summed/max duration without repeating each long SQL template thousands of times. The baseline observations and counts are from the initial harness; the final source snapshot also contains the later timezone and accumulated-state procedures.

## Remaining work and validation

Identify the transaction blocking the actual browser continuation before treating H1/H2 as the original CI root cause. If a duplicate or superseded client request is the trigger, demonstrate that the proposed correction stops server work as well as discarding UI results. If per-candidate cost is the correction target, define a separate queue-read optimisation with an independent unchanged oracle, exact authority/revocation checks, historical-source consistency, non-vacuous row assertions and before/after measurements.

No runtime fix, ready-head browser pass or new desktop-lane duration is available. No full application/unit/HTTP/database regression suite was run: application code is unchanged and this contribution only preserves diagnostic evidence. The server procedures above did execute and pass their explicit assertions. Status-source, foundation and whitespace checks are recorded on the handover with the evidence commit. The draft stays draft; no merge, independent build review, executed business acceptance or deployment is claimed.
