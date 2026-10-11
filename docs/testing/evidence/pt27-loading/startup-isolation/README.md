# PT-27 Customers startup isolation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, existing synthetic Customers directory/record journey. [Decision](../../../../decisions/pt27-loading-performance.md#cold-startup-isolation--11-october-2026).

The declared one/ten/ten/one block passes all **176 directory loads and 44 actual record openings**, preserving the fixture in every position and reporting no HTTP/readiness error. Host CPU median is 38–40% in single-browser positions and 98–99% with ten browsers. Minimum available memory is above 10 GiB throughout; sampled swap use is zero. The large repeatable concurrency difference supports a substantial shared-runner effect. It does not isolate a particular application function, show representative device performance, or explain the original HTTP 503.

## Timings and boundaries

Seconds. Single-browser cold/record cells are **one observation each, not a p95 inference**; warm is the maximum of three. Ten-browser columns use nearest-rank p95: cold/record n=10 and warm n=30 for each viewport. Do not pool columns or substitute single-browser success for ten-user acceptance.

| Viewport/action | Single A1 | Ten B1 | Ten B2 | Single A2 |
|---|---:|---:|---:|---:|
| Desktop cold | 1.406 | 6.094 | 5.968 | 1.434 |
| Desktop warm | 0.344 | 2.986 | 2.802 | 0.320 |
| Desktop record | 1.033 | 4.210 | 4.288 | 1.045 |
| Phone cold | 0.877 | 4.556 | 4.560 | 0.893 |
| Phone warm | 0.338 | 2.319 | 2.505 | 0.325 |
| Phone record | 0.977 | 3.116 | 3.066 | 0.990 |

Only four of twelve ten-user p95 groups meet the unchanged three-second target. Desktop median session-request start moves from 675/761 ms to 3,514/3,307 ms; phone from 624/635 to 2,843/2,638 ms. That interval includes document/assets, hydration, scheduling and session initiation, not just server execution. Component percentiles are not additive.

Every cold sample observes 232,549 script bytes. The compiled Customers manifest enters through `context-screens.tsx`, with three additional chunks beyond the shared application frame totalling 27,663 observed bytes. That module also imports site/facility implementations. The proposed direct CrmDirectory entry targets this unnecessary module boundary; the required directory code is still needed, so 27,663 bytes is not a promised saving. A separate ten-user control/candidate block must measure actual transfer, readiness and receiving-record tradeoffs.

## Instrumentation limitation

The new `browser_work_seconds` field in the retained originals subtracts Chrome counters across navigation. Warm samples include negative values, disproving the assumed continuous interval. **Exclude all these differences, including positive values, from duration interpretation.** Summary groups therefore expose no browser-work duration. Original counter values and original bytes remain intact. Future drivers retain raw before/after readings without subtracting. The independent readiness timer, network observations, fixture assertions and external resource sampler are unaffected. No application change is justified by those invalid differences.

## Provenance and reproduction

[Run 38086160387](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38086160387) succeeds at `20734e177844ea887007b4279a5edea9d205e102`; [CI provenance](ci-provenance.json) includes the job and artifact identity. One Ubuntu 24.04 runner, four logical CPUs, Node 24.21.0, Chrome 155.0.8059.39, PostgreSQL 16.15, one build and one newly prepared synthetic fixture. The fixture retains 1,000 organisations, 5,000 assets and 10,000 appointments. Detailed application logging is off throughout; an initial compiled smoke verifies the diagnostic hooks separately.

Every attempt owns fresh server/browser processes and fresh cold contexts. Desktop 1440×1000 and phone 390×844 touch emulation, four waves per viewport, exact payload/list assertions and actual record activation are unchanged. Network limits remain 40 ms latency, 1.25 MB/s download and 625 kB/s upload, with no exempted request. Acquisition/statement/readiness deadlines remain 3,000/10,000/120,000 ms. No retry, reset, reseed or replacement occurs. OS/database caches and shared cloud scheduling remain limitations. External samples every two seconds cannot isolate individual browser or SQL CPU work.

Dispatch `application-compiled.yml` with `proof=customer-startup`. Summarise a downloaded artifact with `python scripts/summarize-observer-block.py <artifact-root> startup-ci-38086160387-1 <new-output-folder>`. [Summary](summary.json) retains individual groups; [artifacts](artifacts.json) binds exact stored and original bytes, including manifests, screenshots, fixture, smoke, external counters and protocol. All 45 stored/original hash pairs and a private-value scan pass; no session redaction was required. Older Windows and observer blocks remain unchanged and separate.

Screenshots/assertions establish exercised synthetic states only. Full four-view PT-27, original 503 attribution, owner/visual/device/accessibility acceptance, merge and deployment remain open.
