# Open-PR browser assurance repair, 23 September 2026

Owner: Dean Fiedler. Scope: requested repair of failing open pull requests; test harness and component verification only. Parent cases remain P11's controlled service-to-Finance journey, SH shared search/reviews and ES-08 specialist configuration. No application behaviour, schema, business authority or deployment changes.

## Initial customer readiness

PR #292's [diagnostic job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35847717020/job/107137789433) failed on source `b2d7d8810a866695974897776b813a449d54a3aa`. Its observer used the correct customer `/workspace` endpoint, but started its 15-second response timer before navigation. The saved browser lifecycle shows navigation completing at 5,076 ms and the customer request starting around 7,270 ms. Server diagnostics show both customer reads returning HTTP 200 around 12,100 ms after the observer began. The test's deliberate 6,500 ms delay then pushed browser delivery beyond its deadline.

The observer now optionally waits for the actual data request within the existing 60-second navigation budget, then starts its unchanged response budget. Only initial customer navigation selects this option. Command/render observers, the deliberate slow response, identity/status/no-store checks and business assertions remain unchanged. There are no automatic retries.

An unchanged-source retry was considered first, but GitHub refused it while the containing workflow was running. The queued local retry watcher was stopped after the server trace established the timing defect; no retry was started by that watcher.

## Abandoned reads before synthetic reset

PR #293's [broad browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35848257245/job/107139528966) returned 332 passed, 60 skipped and one failure on `4a67e4c96282f0bcdb52aa6f888951f4080123fd`. ES-08 fixture reset deadlocked with permission and engineering-change reads left by the preceding SH suite. This source already included main's `e11e0b3` teardown repair: waiting for current page traffic alone was insufficient because navigation can abandon a browser fetch while its server transaction continues.

SH now registers a fallback GET route before its specific test routes. It retains the real server read through `route.fetch`, preserving its response, so the existing `unrouteAll({ behavior: "wait" })` waits for reads from earlier navigations too. Specific mocks keep precedence and POST commands keep their original transport. The database reset guards, migrations and application transaction handling are unchanged.

## Executed local verification

- Response regression against the original PR #292 helper: failed at the expected 15-second response timeout. The regression delays request readiness and response by eight seconds each.
- Repaired response regressions: four passes across desktop and phone emulation, including an immediate response and a refused response that still times out at the configured deadline.
- Drain regression without retained reads: failed because teardown completed while the controlled local server still held the read.
- Repaired drain regression: two passes across desktop and phone emulation. Teardown remained pending until the server read was explicitly released.
- Focused ESLint and TypeScript `--noEmit`: passed after both fixes.
- Local `python scripts/check_foundation.py`, `python scripts/check_prototype.py` and `python scripts/check_naming.py`: passed; all 78 parent IDs preserved.

The six browser cases use routed synthetic responses and an ephemeral loopback HTTP server; they need no application or database and do not reset the user's local data. The two failing-before/passing-after experiments establish the harness defects, not business acceptance. Full application browser and database results remain on each repaired PR's fresh CI run.

## Branch disposition

- #291 initially incorporated main `5499df4` as `ef8518e`, restoring the existing PL01 calendar-readiness and SH teardown fixes. Its DP-22/local-database documents remain intact. A subsequent diagnostic run failed during route warm-up with 108 unreachable routes before the journey ran; that is distinct from the customer timing defect. Fresh CI after these common fixes must establish its current result.
- #292 retains its adopted field-timer design changes and receives the common harness repair.
- #293 retains its CS completion evidence and receives the common harness repair after the newly observed deadlock.
- #290 had no failed checks at the latest inspection and is left unchanged.

Publication and current-head CI are separate from local evidence. No PR is merged or deployed by this repair.
