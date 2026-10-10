# PT-27 session and context readiness investigation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026. Review: draft, independent/owner acceptance pending. [Decision](../../../../decisions/pt27-loading-performance.md).

## Result

Unchanged main reproduces HTTP 503/readiness failures, but the original cause remains **unproven**. Both prefetch experiments are withdrawn: ProductNavigation again matches main `6c69d92`. The contribution adds working opt-in compiled diagnostics and fixed error categories, not a claimed performance or availability fix. No pool, query, authentication, retry, timeout, dependency, migration or deployment change is made.

The final application build completes two traced runs and one run without detailed logging: **240 directory loads and 60 actual record openings**, with no HTTP/readiness failure and unchanged seven-table fixture fingerprints. The two traced runs observe one database pool, bounded queues and no acquisition failure. All six p95 groups still miss three seconds in every final run. These successes neither erase the initial failure nor establish its cause.

## Every attempt

All labels below are retained separately in [summary.json](summary.json); `pooled` is null. A failed attempt never receives replacement samples or complete timing groups.

| Label | Compiled source | Outcome |
|---|---|---|
| session-control-main | `6c69d92` | Unchanged retained main build. Five of ten first cold-wave checks fail; ten HTTP 503 responses in gateway evidence, including shell/context and saved views. Core response assertions also fail. No detailed route phases were available. |
| session-main-diagnostic | `0e23eff` | 80 loads + 20 openings pass. Next substituted the direct production guard and removed detailed observations; gateway evidence only. This is not a valid connection trace. |
| session-main-runtime-a1 | `3958e0e` | Instrumentation defect: the compiler erased enabled bodies through the inlined environment helper but retained a dynamic guard. Ten first-wave failures and twenty HTTP 500 responses. These are induced observer errors, separate from the original 503s. |
| session-main-trace-a1 | `4882371` | Opaque runtime lookup, after real compiled smoke. 80 + 20 pass; 3,560 route phases; one pool; zero acquisition failures. |
| session-main-trace-a2 | `4882371` | Same preserved build, fresh server/browser processes. 80 + 20 pass; 3,560 route phases; one pool; zero acquisition failures. |
| session-main-observer-off | `4882371` | Same build with detailed logging disabled; fixed failure-category logging remains. 80 + 20 pass, with no dependency-failure log. No gateway file is expected. |

Full commits and build IDs are recorded in the summary and `builds/`. The corrected application build is `vccN4lXZaIVUer6rX-wEy`. The final off-run driver is `73541a2`; earlier driver heads are retained per result. The compiled smoke script's corrected `kind=organisations` bytes were committed in `73541a2` after the smoke execution; verification binds the exact script blob rather than implying it was committed before execution.

## Observations and limits

| Whole-process diagnostic observation | Trace A1 | Trace A2 |
|---|---:|---:|
| Pools created / configured maximum | 1 / 32 | 1 / 32 |
| Measured acquisitions / acquisition failures | 1,620 / 0 | 1,620 / 0 |
| Peak waiting requests observed | 5 | 7 |
| Longest successful acquisition | 3,028.320 ms | 1,489.888 ms |
| Longest connection lease | 2,701.003 ms | 1,092.446 ms |
| Minimum sampled free system memory | 29,749,248 bytes | 636,928,000 bytes |

These whole-process figures include authentication setup as well as measured navigation. A1's longest successful acquisition starts below capacity (24 connections, no idle connection or queued waiter) and records 3,028.320 ms active / zero idle event-loop time. No configured timeout fires for that acquisition; callback/timer scheduling is part of the elapsed time. Lease duration includes query work, callbacks, scheduling and observer work; it is not isolated SQL execution time. There is no basis here to identify slow SQL, pool exhaustion, duplicate pools or PostgreSQL connection establishment as the original failure cause.

A1 falls to about 28 MiB free system memory. Memory pressure, event-loop blocking and synchronous diagnostic I/O remain plausible contributors, not established causes. The off run samples at least 475,238,400 free bytes at its post-readiness checkpoints; those checkpoints are not equivalent to the traced heartbeat. The off run is an ordered diagnostic comparison on the same shared host, not an isolated causal experiment. No other user's processes are stopped.

## Final build timings

Nearest-rank p95; cold/record n=10 and warm n=30 per viewport. Seconds shown below; exact values and raw observations are retained.

| Viewport / action | Trace A1 | Trace A2 | Logging off |
|---|---:|---:|---:|
| Desktop cold Customers | 17.462 | 23.144 | 9.019 |
| Desktop warm Customers | 9.216 | 8.155 | 4.915 |
| Desktop actual record | 10.904 | 11.366 | 7.916 |
| Phone cold Customers | 14.033 | 8.685 | 5.409 |
| Phone warm Customers | 7.643 | 7.274 | 3.260 |
| Phone actual record | 7.846 | 5.813 | 4.580 |

The unchanged profile uses ten independent Chrome processes, 1440×1000 desktop and 390×844 touch emulation, four directory waves per viewport and actual record activation. Node 24.21.0, Chrome 155.0.8059.40, PostgreSQL 16.15 and the existing pinned stack remain. Network conditions remain 40 ms / 1.25 MB/s download / 625 kB/s upload. Acquisition remains 3,000 ms, statement timeout 10,000 ms, server startup/readiness 120,000 ms and target 3,000 ms. No reset, reseed or repair occurs between attempts. Fonts/Kit configuration remains unchanged.

## Existing main CI context

The already-completed [main CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38036877649), exact source `6c69d92`, records 320 compiled four-view reads with zero failures; only four of sixteen groups meet three seconds. Its Customers cold/warm p95 is 6.437/2.702 seconds desktop and 4.125/2.318 seconds phone. The original proof, server profile and artifact provenance are retained in `main-ci/`. This Linux/Chrome .39 four-view run is separate from the Windows/Chrome .40 Customers-plus-record profile; it is not a controlled comparison or proof that host pressure caused the local failure.

## Validation and next boundary

The compiled smoke verifies successful responses, private/no-store policy, real route-complete, acquisition and release events for local-session, shell/context, directory and saved views. Five focused observer/error/pool checks cover runtime refusal, disabled transparency, callback/promise/error/release behavior and privacy. The broader focused set passes 31 units across the focused set and request-scope regressions. Fourteen compiled desktop/phone navigation, permission, saved-view, keyboard/touch, Back and dirty-state checks pass with detailed logging disabled. Build/type/lint, fixture, design-register and repository assurance are listed in [verification.json](verification.json).

The working design register reflects the restored shell policy. Existing 28 stale visual reviews are preserved; captures are functional evidence, not fresh visual or owner approval. The original four-view local stall, full PT-27, PT-30 owner worksheet, physical devices, accessibility, hosted performance and deployment remain open.

Next isolate the host and observer effects with a predeclared traced/untraced block on a controlled runner, retain resource counters, and capture an actual 503 with verified phases before selecting a pool/query/authority correction. Current evidence does not justify an application-side availability fix or adopting the discarded prefetch tradeoff. Keep PR #391 in draft.

## Reproduction and integrity

Use the existing disposable `ppo_synthetic_test` fixture and the preparation described in the [parent evidence](../README.md). Preserve it between runs. Build the declared application source; set `PPO_COMPILED_SOURCE` to its full commit and configure the private task-owned port/database. First run `scripts/quality-database-proof-smoke.ts <new-label>` through `node --env-file=.env.local --import tsx` with `PPO_PROOF_DIAGNOSTICS=1`. Then run the unchanged Customers comparison driver under each declared logging mode. Output labels must be new. The smoke uses a separate fresh server and is outside the measured runs.

`scripts/summarize-session-readiness.py <new-output-folder> <all-attempt-folders...>` retains exact raw bytes in deterministic gzip files and reports incomplete attempts explicitly. [artifacts.json](artifacts.json) binds stored and uncompressed bytes. The older attempt manifests and source snapshots are unchanged; only the live parent README's manifest entry is refreshed when its current scope changes. No cookies, headers, SQL, parameters, connection configuration or arbitrary exception content is logged by the new observer.

## Compiled mobile CI fixture repair — 10 October 2026

At head `ff5a6ba15da14b640c18f678a92b6856a0d92112`, [compiled mobile job 114196047195](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38046173315/job/114196047195) records 345 passes, 74 skips and one failure. N01's fixture-driven switch to Technician throws `apiRequestContext.post: read ECONNRESET` at `navigation-context.spec.ts:45`. The aggregate compiled check consequently fails; desktop and retained proofs pass. This is a transport reset without an HTTP response, not a reproduction of the earlier session-read 503s.

The retained artifact `compiled-application-browser-mobile-evidence` (ID `11668044130`) binds the browser result and server events. N01 starts at 11:02:08.939 UTC and fails after 6,485 ms. Process 5485 records the initial session POST as request 19926 with HTTP 200, and subsequent session GETs 19961/20022 with HTTP 200, but no further session POST before the test ends. The failed switch therefore has no gateway receipt in this trace. An idle API connection closing during reuse is consistent with the evidence and the existing fixture transport workaround; the precise socket race is not established by these events. The failing test's source is identical on main `6c69d92` and observed main `ed3ccb8`; the original application-availability cause remains unproven.

Generalise the existing CRM fixture helper as `browserFixtureCall` and reuse it for contextual-navigation setup and identity switches. Each fixture request uses `Connection: close` from its first request, preserving the browser-context cookie jar, exact command and successful-response assertion. Actual browser navigation, permission denials, return links and all original assertions remain. No retry, timeout, application, shell, diagnostic or database-policy change is included. The real HTTP regression also rejects a lost POST response after exactly one received command and rejects HTTP 503 after exactly one request.

Local verification: five focused transport/diagnostic units, typecheck, changed-file lint and naming assurance pass. The retained compiled build `vccN4lXZaIVUer6rX-wEy` passes N01 and baseline shell navigation on both desktop and phone, plus the unchanged route warm-up: five browser checks, zero failures. This uses a separate disposable `ppo_synthetic_test` cluster, leaving the retained performance fixture untouched. The first pre-repair browser attempt times out at the unchanged 120-second server-start boundary before any test executes; it does not reproduce N01. A separate launcher eventually starts. Original local logs/results remain outside Git in the task's `pr391-ci-*` files. Full updated-head CI is separate from local verification; no original-503 fix or PT-27 acceptance follows from this fixture repair.
