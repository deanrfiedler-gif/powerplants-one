---
document_id: PPO-CI-PERF-PROFILES
revision: r02
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Original comparison reviewed; closed scope editor remedy awaiting CI
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

The follow-through mounts an existing saved scope's editor on its first native disclosure opening. After that opening it remains mounted when closed, preserving the unsaved proposal and an uncertain original command. A work order without a saved scope still opens and mounts its first editor immediately. The existing revision key, permission boundary, scope command, asset filter and original request remain unchanged. The existing desktop/phone P04 case now observes zero asset reads before opening, one successful read on first opening, and the exact retained proposal with no extra read after closing and reopening. Its invalid/stale proposal and keyboard assertions remain in place.

No measurement script, fixture, timing boundary, network rule, threshold, retry or workflow changes accompany this remedy. Its source must pass application and browser checks and repeat the same two profiles before any speed improvement can be reported. Full PT-27 remains open.
