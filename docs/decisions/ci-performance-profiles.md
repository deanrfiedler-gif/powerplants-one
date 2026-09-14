---
document_id: PPO-CI-PERF-PROFILES
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implemented comparison; CI evidence pending
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
