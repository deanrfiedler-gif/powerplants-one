# PT-27 direct directory entry — first candidate

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft; **superseded by the declared receiving-panel refinement**, not an accepted whole-page speedup. Scope: PT-27, NFR-04, AT-23 and CS-01/CS-02. [Decision](../../../../decisions/pt27-loading-performance.md#direct-customers-entry-candidate--11-october-2026).

The control/candidate/candidate/control block passes **320 directory loads and 80 actual record openings** with exact fixture preservation and no observed HTTP/readiness errors. Initial script transfer falls from **232,549 to 216,479 bytes in every cold sample: 16,070 bytes / 6.91% less**. CSS remains 103,569 observed bytes. Both desktop cold p95 repeats improve, but phone cold and desktop receiving results are mixed. Three of twelve candidate p95 groups meet three seconds, versus two control groups. The target remains unmet.

## Timings

Seconds, nearest-rank p95; cold and record n=10, warm n=30 per viewport/attempt. Attempts remain separate; percentiles are not pooled.

| Viewport/action | Control A1 | Candidate B1 | Candidate B2 | Control A2 |
|---|---:|---:|---:|---:|
| Desktop cold | 6.848 | 5.960 | 6.132 | 6.732 |
| Desktop warm | 3.357 | 2.883 | 3.269 | 3.164 |
| Desktop record | 4.787 | 5.245 | 4.643 | 4.486 |
| Phone cold | 5.034 | 5.247 | 4.810 | 4.778 |
| Phone warm | 2.580 | 2.769 | 2.644 | 2.805 |
| Phone record | 3.272 | 3.071 | 3.235 | 3.369 |

Host CPU medians remain 98.25–98.56%; minimum available memory is 10.08–10.19 GiB, sampled swap zero. This is still a shared four-CPU runner with ten browser processes, server and database. Desktop record B1 is slower than both controls; B2 falls within the controls' range. These results do not establish an overall latency gain or isolate the cause of that receiving variation.

The compiled manifest confirms the intended change from ContextList's broad client entry to CrmDirectory. The five shared-frame chunks stay identical. Three directory-specific chunks become two. The customer receiving source still imports the broad context module solely for DuplicateCandidates, so the next bounded refinement extracts that unchanged panel and repeats the whole block against the same original control. Retain this trial in full; do not substitute the refinement's results for it.

## Provenance and method

[Run 38086863599](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38086863599) succeeds. Control `20734e177844ea887007b4279a5edea9d205e102`, build `Ix4GIyUFQX1MTlgytr7Iv`; candidate and identical driver `6b57f8d7eb586160fd821303bd7c8ca86948c3ca`, build `EdXU6VRYJZBUgyQhLN9yC`. [CI provenance](ci-provenance.json) includes full job outcomes and uploaded-artifact identity. An earlier dispatch at `6163481` was rejected for an unsupported job-level runner expression; it produced no measurement. The corrected source resolves the checkout path inside a runner step.

One Ubuntu 24.04 runner, Node 24.21.0, Chrome 155.0.8059.39 and PostgreSQL 16.15; one build per source; identical locked dependencies and database source; one fixture prepared once. Seven-table fingerprints retain 1,000 organisations, 5,000 assets and 10,000 appointments. Authentication/session/audit activity is excluded from fixture equality. The same driver/profile bytes are copied to the control after compilation and declared independently of compiled source. Every position uses fresh app/browser processes and logging off, with identical external resource sampling. No retry/reset/reseed occurs.

The original desktop 1440×1000 / phone 390×844, four-wave, ten-browser workload and actual record activation remain unchanged. Network limits: 40 ms, 1.25 MB/s down, 625 kB/s up, no exempted requests. Three-second target and 3,000/10,000/120,000 ms acquisition/statement/readiness limits remain. OS/database cache and cloud scheduling effects are not eliminated by the order. Chrome raw counters are retained without interpreting cross-navigation differences as action duration.

## Evidence and limits

[Summary](summary.json) includes source/build checks, timings, transfer and resource distributions. [Artifacts](artifacts.json) verifies all 45 stored/original hash pairs and the private-value scan passes. Original manifests, captures, samples, logs, fixture and compiled smoke remain retained. The inspected candidate desktop/phone directory captures preserve the observed table/card composition; this is functional inspection, not owner acceptance or a paired approved-reference review.

Reproduce with `application-compiled.yml`, input `proof=customer-candidate`, at the declared candidate source. Summarise with `python scripts/summarize-observer-block.py <artifact-root> candidate-ci-38086863599-1 <new-output-folder>`. Original HTTP 503 attribution, full four-view PT-27, owner/device/accessibility acceptance, merge and deployment remain open.
