# PT-27 browser and static-server correlation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, CS-01/CS-02. [Decision](../../../../decisions/pt27-loading-performance.md#asset-request-correlation--11-october-2026).

The declared block captures **nine original cold timeouts**, with 181 of 190 attempted directory loads passing and all 40 attempted record openings passing. In every failed browser, the first five stylesheet responses finish at the server within 82 ms of their respective receipts, while Chrome records no stylesheet completion. All 117 JavaScript request-start observations across those browsers lack response headers. Eight failed browsers have no matching JavaScript receipt at the server; the ninth has two receipts only around 120.1 seconds, near browser cleanup, with one abort. No session/directory request or HTTP 503 is observed in the failed windows.

This identifies an earlier hold point than the API: received stylesheets have been handed to the operating system, yet Chrome's asset loading has not completed and subsequent JavaScript has not reached the server during initial loading. It does not prove that every byte reached Chrome or identify a specific browser, transport or emulation defect. A separately declared post-failure release probe will test the emulation hypothesis; these original failures are not replaced.

## Attempts

| Position | Directory loads | Actual record openings | Outcome |
|---|---:|---:|---|
| Shared A1 | 80 pass | 20 pass | Complete |
| Whole-core B1 | 9 pass / 1 timeout | 0 | Desktop cold user 5 fails |
| Whole-core B2 | 45 pass / 5 timeouts | 10 pass | Phone cold users 0, 2, 6, 8 and 9 fail |
| Shared A2 | 47 pass / 3 timeouts | 10 pass | Phone cold users 5, 2 and 7 fail |

All four declared positions execute without retry. Failed positions stop after their failing wave. A1's descriptive cold p95 is 6.781 seconds on desktop and 4.923 on phone; both miss three seconds. Three incomplete positions prevent a complete latency comparison. No timing gain or performance acceptance is claimed.

The nine failed traces contain 45 early stylesheet finishes (maximum server elapsed 81.977 ms). Seven further stylesheet finishes and two JavaScript receipts occur near cleanup; they are retained separately in time and do not establish progress during the failed window. The original driver did not store a distinct failure-boundary wall timestamp, so these near-120-second tail events must not be assigned a more precise before/after boundary. Browser observations stop at sample failure, while the server log is copied after browser cleanup. The next probe freezes samples with an explicit boundary and separates later server events.

No browser `loadingFailed` event is observed before the failed windows end. Some CSS headers/data arrive, but no CSS loading-finished event does. Missing events do not imply a particular network error. Cached warm assets legitimately lack server receipts; the summary exposes this instead of counting every unmatched asset as a failure. Detailed application/database logging remains off, so there is no new acquisition-timing claim.

## Source and checks

[Run 38098218812](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38098218812) fails as required on source `16db9f3c8a8e1abde7a37df54e0b71fa4483772a`, build `ktcWa5k3hWGJk4PMbd-kH`. It uses one runner/build/fixture, ten independent browsers, the original desktop/phone waves, payload and receiving assertions, 40 ms / 1.25 MB/s down / 625 kB/s up conditions, three-second target and original deadlines. All four positions use the same asset observer. The app/database and browser/driver use the previously verified whole-core allocation in B1/B2; all **232,077 repeated sampled thread-mask checks** have zero violations. This is repeated sampling, not a count of unique threads or independent host isolation. Sampled available memory stays above 10.06 GiB.

All four starting seven-table fixture fingerprints match. A1 retains its matching final fingerprint; failed positions have no invented post-run capture. Actual tagged JavaScript receipt/finish checks pass for completed cold waves. Build, compiled diagnostic smoke, five TypeScript and eight Python guard tests pass before measurement. The workflow failure and missing waves remain explicit.

[Summary](summary.json), [CI provenance](ci-provenance.json) and the [50-file integrity manifest](artifacts.json) preserve available original samples, event logs, captures, source/build manifests, process/affinity records and support files. Stored/original hashes and private-value scans pass. These observations add overhead and are source-specific; do not compare their absolute times with earlier uninstrumented runs as an application change. Application `src/`, database and dependencies remain unchanged from integrated source `3a626e6`.

Keep PR #391 draft. The original 503 cause, three-second target, full four-view PT-27, owner/device/accessibility acceptance and deployment remain open. The separately retained [planner CI repair](../planner-ci-repair/README.md) changes response selection in a test, not planner behaviour.

The recorded-source `16db9f3` summary reproduces byte-for-byte from the original download. All 46 core artifact manifest entries also reproduce exactly; four support records complete the 50-file integrity manifest.

The subsequently predeclared [post-failure release diagnostic](../asset-release/README.md) captures three additional original timeouts and locates a browser emulation-path dependency. It does not alter or reclassify the nine original failures here.
