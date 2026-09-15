---
document_id: PPO-CI-PERF-PROFILES
revision: r05
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Original measurements retained; PR #175 regression repair awaiting CI
source_commit: 3a27728c2c41e366a4863683fac748cd0d1da910
---

# Observe development and compiled core-read performance

Dean authorised audit follow-through. Audit task 6 / PT-27 requires useful performance evidence before choosing a remedy. Actual-main `aeaf966a` run [34805010402](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34805010402), job `103855071769`, completed 320 original core reads without errors, but all 16 viewport/view/phase groups missed the 3,000ms candidate; warm p95 ranged from 5,365 to 11,538ms. Those measurements used the guarded development server, not the compiled hosted application. They establish a timing shortfall on that declared profile, not its cause.

## Implemented measurement

The existing performance entrypoint now runs two separate original profiles, development then compiled. It uses the already adopted [compiled synthetic launcher](ci-compiled-browser-suite.md); no technology, dependency, production identity or workflow changes are introduced. The development profile keeps its original evidence paths. Compiled results live under `verification-evidence/p11-performance/compiled/`; `profile-comparison.json` retains each exit status and original group results even when one profile fails. Either profile's core-read or screenshot failure fails the combined procedure. Candidate timing misses remain visible candidate misses, as before.

Each profile runs the same four views, two viewports, ten independent browser processes, first-context wave and three warm waves: 320 samples each. Global 40ms latency, 10Mbps download and 5Mbps upload throttling still applies to HTML, assets and every core GET. Each GET must prove its network rule. The timed boundary still ends after successful core JSON, settled identity, enabled identity control, finished loading, no business error and two animation frames. No warm-up navigation, retry, route exemption, timeout increase or sample substitution is added. Existing 25-minute step and 30-minute job bounds cover both profiles together; a deadline failure remains a failure.

The existing additive load fixture runs once. Before and after each profile, a read-only repeatable-read transaction counts and hashes every baseline and added row in the seven fixture tables (organisations, assets, location events, work orders, ticket links, scope revisions and appointments). Compiled measurement requires the same checkout tree, run, attempt, 1,000 organisations, 5,000 assets, 10,000 appointments and exact original fingerprints. A mismatch refuses measurement; it cannot reset, recreate or repair the fixture. This is equality of the declared fixture tables, not a claim that login/session/audit records or the entire database stayed unchanged.

Every successful sample now retains the bounded path/status/timing observations already captured for failures. Navigation-clock landmarks identify document response, first core request, parsed core body and the later settled UI boundary; these phases can overlap and do not establish a cause. No headers, query strings, bodies, cookies or session data enter those records. Failed observations freeze before screenshots or probes. Distinct application/measurement PIDs, source/tree/run and compiled build ID identify each profile. Compiled NetLog capture uses a separate subdirectory of the same guarded temporary location; its metadata is prepared after browser shutdown, with raw capture removed. The original development capture remains available to the existing always-run cleanup step.

## Limits and verification

Development runs first. Browser contexts and application processes are fresh, while database/OS caches and runner conditions carry over. This is an ordered diagnostic comparison, not a randomised causal experiment or a benchmark of the Azure/Entra container. Compiled local mode uses the production client bundle and development React on the server under the unchanged non-production synthetic guard. Physical devices, screen readers and full PT-27 acceptance remain open.

Local maintained Node 24.21.0 lint and TypeScript checks passed during implementation. The relevant existing NetLog tests and all three documentation checks are run before publication. No local PostgreSQL or controlled browser runtime is available; actual fingerprints, both measured profiles, retained failures and raw phase observations require the source's CI run. Do not report a performance improvement until those original observations support one. Use the resulting phase evidence to select a bounded code or query change, then measure that exact change under the same profiles.

## Original comparison and bounded follow-through

PR [#175](https://github.com/deanrfiedler-gif/powerplants-one/pull/175), source `1f61fe88507f98e581baf65dbcaa3c497516ddad`, tree `c551a8e7aac89a8cad95ca6b21dcb8e5c9effb92`, completed both profiles in run [34814155328](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34814155328), job `103881221816`. All 640 original samples succeeded; both fixture-after records prove the seven-table fixture unchanged. The original artifact `10335988513` is 31,588,088 bytes with SHA-256 `3e3e5dc3553efa6db76cf2602a2e58865bbf071275c70ad9c18f42fd607b9876`; downloaded bytes, ZIP integrity, source/tree, distinct processes and fixture equality were reviewed. All 16 groups in each profile still miss the 3,000ms candidate.

| Warm p95, seconds | Development desktop | Compiled desktop | Development phone | Compiled phone |
|---|---:|---:|---:|---:|
| Customers | 6.740 | 4.867 | 6.605 | 3.985 |
| Work order | 10.547 | 5.448 | 10.808 | 5.102 |
| Planner | 7.404 | 4.770 | 7.603 | 4.665 |
| My jobs | 5.426 | 3.181 | 5.145 | 3.044 |

These are separate observed profiles under the limitations above. They do not establish that compilation caused the differences. Work-order observations retain a substantial interval after the core body: combined-viewport warm p95 for that phase is 5,159ms development and 2,074ms compiled. Code inspection found that the closed scope editor mounts its asset picker immediately and requests up to 200 assets. Reading the saved scope does not require that picker. The benchmark's existing settled-UI boundary waits for loading indicators, including the hidden editor's indicator. This makes deferring the closed editor a concrete candidate remedy; it is not yet a measured attribution or improvement.

The follow-through mounts an existing saved scope's editor on its first native disclosure opening. After that opening it remains mounted when closed, preserving the unsaved proposal and an uncertain original command. A work order without a saved scope still opens and mounts its first editor immediately. The existing revision key, permission boundary, scope command, asset filter and original request remain unchanged. The existing desktop/phone P04 case now observes zero asset reads before opening, the exact first-mount read count for its declared server profile with a successful response, and the exact retained proposal with no extra read after closing and reopening. Its invalid/stale proposal and keyboard assertions remain in place.

No measurement script, fixture, timing boundary, network rule, threshold, retry or workflow changes accompany this remedy. Its source must pass application and browser checks and repeat the same two profiles before any speed improvement can be reported. Full PT-27 remains open.

## First original remedy measurement

Source `c992dd7f52f6165d2f4cd168724de398d9497476`, tree `d1e8da807fe3efdc6d6023c9671a381dcfc5cd06`, passed performance job `103891100794` in run [34817454342](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34817454342). Both profiles completed 320 original successful reads, all core requests proved the network rule, and each fixture-after record is unchanged. Original artifact `10337396547` is 31,108,676 bytes, SHA-256 `16a6e9afa726ab1a5bdae3c8cb38632411833c6bd3642843bfb56b1e93d70d69`. Downloaded bytes, ZIP integrity, all 16 image manifests, source/tree/run, distinct processes and fixture equality were verified. The four original desktop/phone work-order PNGs across both profiles were inspected; no new visible defect was identified in those regions.

| Warm p95, seconds | Development desktop | Compiled desktop | Development phone | Compiled phone |
|---|---:|---:|---:|---:|
| Customers | 5.169 | 3.443 | 4.998 | 2.949 |
| Work order | 4.658 | 2.623 | 4.782 | 2.319 |
| Planner | 5.568 | 3.390 | 5.312 | 2.960 |
| My jobs | 3.896 | 2.314 | 3.915 | 2.129 |

Eight of sixteen compiled groups meet the candidate, including both warm work-order groups; all sixteen development groups still miss it. Compiled desktop first-context work-order p95 is 3.114s and remains above target. The combined-viewport warm work-order interval after the core body falls from 5,159ms to 759ms in development and from 2,074ms to 385ms compiled. These are the original observations of the changed source under unchanged scripts, not a controlled estimate of the editor's isolated causal effect: other unchanged views also improved, so runner/cache variation contributes. No profile, sample, failure or candidate miss was removed.

Application PIDs are 5572 (development) and 10440 (compiled), measurement PIDs 5459 and 10425, comparison ID `2dde0a32-b783-4bd2-a338-1474d69d64c0`, compiled build `BJHHS3Ct7jUXkver2_70P`. The production-shaped compiled fixture still uses the guarded synthetic launcher. Full application/browser regression and the combined integration remain required; PT-27 and hosted/physical-device acceptance are incomplete.


## Original integration measurement and browser finding

Integration source `7bfde7871d3e8440ff3d42f6ab751395a50433cb`, tree `c7fffb611dff224252b217af7381134e247f41b6`, completed the unchanged comparison in run `34818799844`, job `103895338399`. Original artifact `10336559716` is 31,390,577 bytes, SHA-256 `7a1b46eb148ab9e931f6d1b76a8d1b5fabf8e9b2e1ce656223d51d92dad2e2eb`. ZIP integrity, all 16 PNG manifests/hashes/provenance and the unchanged seven-table fixture were verified; all 16 original PNGs were inspected. Both profiles again retain 320 original successful reads and the applied core-request network rules.

| Warm p95, seconds | Development desktop | Compiled desktop | Development phone | Compiled phone |
|---|---:|---:|---:|---:|
| Customers | 7.636 | 4.846 | 6.504 | 4.189 |
| Work order | 6.151 | 3.778 | 6.310 | 3.193 |
| Planner | 7.063 | 4.533 | 7.013 | 4.025 |
| My jobs | 5.048 | 3.250 | 5.134 | 2.802 |

Only one of sixteen compiled groups meets the candidate; all sixteen development groups miss it. This run is slower than the first remedy run. Both observations remain, and the integrated work-order result is not represented as meeting three seconds. Combined-viewport warm work-order phase p95 milliseconds are document response 958/160, first core request 4,859/1,846, parsed core body 5,721/3,375 and body-to-settled 966/560 (development/compiled). These remain ordered observations, not isolated causal or hosted-performance proof.

The broad development-browser stages on original #176 source `c992dd7f` and integration `7bfde787` each failed the new P04 first-open request-count assertion on desktop and phone: expected one request, observed two. Their original reports show 166/176 passing cases respectively, two failures, three explicit skips and no flaky retries. Archives `10338381055` (126,620,085 bytes, SHA-256 `2cb9cfa18af50f81637c38881806d45bf229b6b0d78a3a62da14092ba7000907`) and `10338976154` (128,389,779 bytes, SHA-256 `5a281dcae7c2de1dcd4d2aa17fbbe465c62d6227658a305b250dbd4739cbf1b8`) were verified, and all four original failure PNGs inspected. The test had already observed zero reads before opening; it stopped before its new close/reopen assertions. Compiled source suites passed this case with one initial request. Neither development failure is relabelled as a pass.

The original shared resource hook starts an API read during effect setup and ignores a cleaned-up effect's response. [React Strict Mode](https://react.dev/reference/react/StrictMode) repeats effect setup/cleanup in development; the development and compiled client launches therefore have different first-mount request counts. The corrected P04 instrumentation explicitly validates the declared launcher and expects exactly two initial requests for `npm run dev` and one for `npm run serve:compiled`. It still requires zero before opening, a successful asset response, the exact same count after closing/reopening, and the identical retained proposal. The existing invalid/stale, keyboard and layout assertions remain. Strict Mode, the application/hook, all performance samples, network settings and deadlines are unchanged. Fresh corrected development and compiled proof is required.

## PR #175 follow-up regression repair

The original comparison/remedy is incorporated through main `10625815187f26179f316b887fcdee33467ac81f` / #177. Subsequent estimating changes on #175 are a separate source. The first correction `3db9e251fd18639e8ca4c0a29e4fd37a01b259e6`, tree `abfb24a55a50f832a26a7ae33758d383a5ce29e7`, restored migration 0026's constraint-before-backfill order. Its [E1 job 103935224583](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34831365860/job/103935224583) completed successfully, including the previously failing upgrade, direct HTTP, restart and browser steps.

The same source's broad [Application job 103935224503](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34831365862/job/103935224503) passed 411 of 412 database and 175 of 176 browser cases, with three browser skips; it failed the retained E2 legacy-archive case and the phone P05 final capture. It passed 104 unit plus three preparation cases and all 29 HTTP cases. Its performance and compiled-browser checks passed. None of those passes supersedes the two broad failures.

The repair merges current main and removes the legacy Estimate early return before `requireActiveOption`. Active legacy estimates can still create a new version and quotation; archived ones cannot. The retained migration case now supplies the actual current Estimate/quote versions to both refusal assertions, checks unchanged records, and separately verifies the original saved version and quote bytes after restart. This distinguishes archive authority from stale-version rejection.

Original receipt and audit lookup again use `(workspace_id, actor_id, operation_id)` and recheck current workspace edit/owner authority. A real-database case creates two owned workspaces with the same operation UUID under distinct synthetic actors, verifies independent exact lookup/replay without new effects, and then revokes one actor's edit access while preserving the other's recovery. The later unbounded OFFSET scan is removed in favour of main's existing 100-candidate bound. The independent answer-order helper and additional UI refusal checks are retained; no saved payload/hash is rewritten.

The P05 failure occurred after the move receipt was accepted: `Loading permitted records…` remained during the schedule refresh beyond the capture's 5-second assertion. Code inspection shows acceptance triggers a separate GET; the test now registers that response before retry, verifies its success and exact saved appointment position/assignment version, then retains the original loading/layout/capture checks. It adds no sleep, retry, threshold or timeout increase. This corrects evidence ordering; it does not establish why that source's refresh was slow or claim a planner performance improvement. Fresh development and compiled browser evidence remains required.

The existing estimating workflow now runs `estimating-workspaces.test.ts` alongside its E1 database entrypoint, under the same serial execution, disposable database and deadlines. The failing archive case was previously absent from this focused job. No new workflow, dependency, schema, deployed environment, benchmark sample, network rule or timing threshold is introduced. All performance scripts and migration 0026 match the merged main source exactly. Local Node 24.21.0 validation passed 105 unit tests, TypeScript, full ESLint, the compiled build and all three documentation checks (78 parents and 15 issued sources preserved). Fresh CI outcomes are recorded on the PR; PostgreSQL/browser execution is unavailable in this local checkout.
