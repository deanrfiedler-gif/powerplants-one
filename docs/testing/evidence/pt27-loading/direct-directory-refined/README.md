# PT-27 direct directory and receiving-panel refinement

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, CS-01/CS-02. [Decision](../../../../decisions/pt27-loading-performance.md#receiving-panel-refinement--11-october-2026).

Retain the small import-boundary correction: Customers enters CrmDirectory directly with its existing stylesheet, and CustomerWorkspace imports the unchanged DuplicateCandidates panel without the broad context screens. Initial script transfer is **216,479 versus 232,549 bytes in every cold sample: 16,070 bytes / 6.91% less**. Both directory and receiving manifests retain the same five shared-frame chunks and reduce their additional entry chunks from three to two. The observed CSS transfer stays 103,569 bytes. No session, scoped query, grant, navigation policy, timeout or visible control is changed.

The predeclared original-control/refined/refined/original-control block passes **320 directory loads and 80 actual record openings**, with exact fixture preservation and no observed HTTP/readiness errors. Refined desktop record p95 is 2.228/2.405 seconds versus control 2.550/2.538. This block no longer shows the first candidate's desktop receiving slowdown. It does not establish a repeatable overall latency gain: phone cold and warm results vary with order, and all cold groups still miss three seconds. Each position meets four of six p95 groups, eight of twelve for the candidate combined. **PT-27 remains open; PR #391 stays draft.**

## Timings

Seconds, nearest-rank p95. Cold/record n=10 and warm n=30 per viewport and attempt. No pooling or substituted samples.

| Viewport/action | Control A1 | Refined B1 | Refined B2 | Control A2 |
|---|---:|---:|---:|---:|
| Desktop cold | 4.560 | 4.435 | 4.212 | 4.353 |
| Desktop warm | 2.182 | 2.269 | 2.211 | 1.862 |
| Desktop record | 2.550 | 2.228 | 2.405 | 2.538 |
| Phone cold | 3.258 | 3.273 | 3.183 | 3.212 |
| Phone warm | 1.964 | 1.828 | 1.732 | 1.732 |
| Phone record | 1.975 | 1.932 | 1.906 | 1.808 |

Host CPU median remains 97.75–97.99%, minimum available memory 10.07–10.21 GiB, sampled swap zero. The [one-browser isolation](../startup-isolation/README.md) establishes a substantial concurrency/runner effect on its own source-bound block. Absolute timings across CI blocks must not be compared as an application speedup: this block's unchanged control is itself faster than the [first candidate block's](../direct-directory/README.md) control. The stable byte reduction and within-block comparisons are the supported findings.

## Source and method

[Run 38087829099](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38087829099) passes both builds, compiled diagnostic smoke, profile/counter guards and all four attempts. Control source `20734e177844ea887007b4279a5edea9d205e102`, build `XzOlfz5KvXgqNjPmgVixN`; refined source and shared driver `6e85c288ef72704c2e4006f747013360632896a6`, build `mb2wEhSN0coESqxS6ALyL`. [CI provenance](ci-provenance.json) records the original job/step results and artifact digest. Broader PR browser assurance is separate from this comparison.

One Ubuntu 24.04 runner with four logical CPUs, Node 24.21.0, Chrome 155.0.8059.39 and PostgreSQL 16.15. Each source is built once using identical locked dependencies. Database source and the current copied driver/profile/fixture bytes are checked equal. One fresh synthetic fixture is prepared once: 1,000 organisations, 5,000 assets and 10,000 appointments. Every attempt preserves the seven declared tables; session and audit activity is deliberately outside that fingerprint. Fresh app/browser processes, ten browsers, four waves per viewport, detailed logging off and identical external two-second sampling apply throughout. No retry, reset or reseed occurs.

Desktop 1440×1000 and phone 390×844 touch emulation; exact directory payload/list assertions and real record click/tap with exact identity/URL receiving assertions. Network limits remain 40 ms latency, 1.25 MB/s down and 625 kB/s up with no exempted requests. The three-second target and 3,000/10,000/120,000 ms acquisition/statement/readiness limits are unchanged. Manifests and raw browser counters are collected outside the readiness boundary. Cross-navigation counter differences are not interpreted as browser-work duration. Shared caches, runner CPU contention and cloud scheduling remain limitations.

## Verification and disposition

The separate [focused regression run 38088658645](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38088658645) passes at `fae7e3f96ff98a0edfb9198762f52ee08a6202e1`, build `nOF2Hp9SI52P_elFS3M3D`, whose application files match the measured `6e85c28` source. **Five passed, zero skipped, failed or flaky:** original route warm-up plus P03 and directory-navigation in both desktop and phone projects. P03 verifies the exact other same-name organisation link and excludes the current record; the directory case exercises real keyboard/touch handovers, numeric and affiliation links, creation and context sections. Existing P03 permission and broader contact/site/My Work assertions are retained. The fresh standard synthetic seed is separate from the measured load fixture. Original timeouts and warm-up remain; no retry is added.

The [focused summary](regression/summary.json), [CI provenance](regression/ci-provenance.json) and [28-file integrity manifest](regression/artifacts.json) retain the original report, request observations, captures, smoke and redaction record. All hashes and private-value scans pass. Desktop/phone P03 record captures were inspected for the preserved receiving composition; that inspection grants no visual/owner acceptance. Full PR assurance remains independently running at this handover and is not represented by these five focused checks.

[Summary](summary.json) validates each source/build/driver/fixture identity and preserves separate timing/transfer/resource distributions. All **49 stored/original hash pairs** in [artifacts](artifacts.json) verify, and the private-value scan passes. Retained files include directory and receiving manifests, exact samples, counters, logs, screenshots, fixture and compiled smoke. The duplicate-panel function body is preserved exactly apart from the name of its narrowed local TypeScript response type; the existing P03 desktop/phone journey gains exact same-name/self-exclusion assertions.

Candidate B1 desktop/phone receiving captures were inspected against the retained composition. Functional state and module-boundary verification do not constitute owner visual approval, a paired approved-reference review, physical-device or screen-reader acceptance. The live register retains 322 unreviewed entries and 28 stale reviews; component reviews remain pending. Guides and consumer/state/alignment bindings are updated without changing task instructions or granting review.

Reproduce using `application-compiled.yml` with `proof=customer-candidate` at the declared refined source, then `python scripts/summarize-observer-block.py <artifact-root> candidate-ci-38087829099-1 <new-output-folder>`. Keep all previous blocks unchanged. The next measurement design must distinguish client CPU contention from service capacity before attributing the remaining cold delay to a server function. The original HTTP 503 still requires a failing request with verified phases; full four-view PT-27, owner/device/accessibility and hosted acceptance, merge and deployment remain open.
