# PT-27 post-failure network-emulation release

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, CS-01/CS-02. [Decision and predeclaration](../../../../decisions/pt27-loading-performance.md#asset-request-correlation--11-october-2026).

All three captured pre-API stalls remain failed at the original 120-second deadline and persist through a further ten seconds with conditions unchanged. Removing only the browser's CDP network-emulation rule then resumes the existing navigation: all 13 JavaScript assets complete, and the directory returns HTTP 200 with the exact expected fixture payload in each browser. Response headers arrive 312–663 ms after the release begins; payload verification completes within 699 ms. No reload, retry, app reset or replacement measured sample occurs.

This supports a diagnosis of a stall in the browser's emulated request path for these captured cases. It does not identify a specific Chromium defect, distinguish every internal transport mechanism, establish the cause of the earlier HTTP 503s, or justify relaxing the agreed network profile. The three released reads are post-failure diagnostics, not successful PT-27 samples or measured UI readiness. The workflow correctly fails.

## Recorded source and method

- [Run 38099530550](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38099530550), [job 114352392809](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38099530550/job/114352392809), source `294d130580fb812366fbbda8c29084a6c825298f`, build `28FVekaC3oFMsBWjD-90R`. Node 24.21.0, Chrome 155.0.8059.39, Linux. [CI provenance](ci-provenance.json).
- One runner/build/fixture; ten browsers at 1440×1000 and 390×844; shared / whole-core / whole-core / shared. Four logical CPUs comprise two complete sibling groups. Constrained positions use app/PostgreSQL CPUs 0–1 and browser/driver CPUs 2–3, with the same kernel cgroup constraint and two-second external sampler.
- Original network conditions are 40 ms latency, 1,250,000 bytes/s download and 625,000 bytes/s upload. The three-second target and 120-second original readiness deadline remain unchanged. Detailed application/database logging is off; bounded asset observation is on throughout.
- Each eligible failure is deep-copied with an explicit wall-clock cutoff and saved to its own `asset-failure-*.json` before intervention. The corresponding `results.json` sample matches that saved original exactly. A ten-second unchanged phase precedes the ten-second release phase; both retain their own network observations in `asset-release-*.json` and the aggregate `asset-release.json`. Server events after the cutoff are kept separately in the summary.
- The original seven-table synthetic fingerprint matches at every start. Both complete shared positions also retain matching post-run fingerprints. Failed positions have no substituted post-run fingerprint or later measured waves.

## Original outcomes

| Position | Directory attempts | Passing loads | Original cold timeouts | Passing record openings |
| --- | ---: | ---: | ---: | ---: |
| A1 shared | 80 | 80 | 0 | 20 |
| B1 whole-core | 10 | 9 | 1 desktop | 0 |
| B2 whole-core | 50 | 48 | 2 phone | 10 |
| A2 shared | 80 | 80 | 0 | 20 |
| Total | 220 | 217 | 3 | 50 |

All 188,203 repeated sampled thread-mask checks satisfy the declared allocation; available memory remains above 10.25 GiB. No observed HTTP error or HTTP 503 occurs. The incomplete B positions cannot form a complete latency comparison. Descriptive cold p95 in the complete shared positions is 5.281/6.053 seconds on desktop and 4.698/4.809 seconds on phone, still above three seconds. Cross-runner absolute times are not treated as application gains.

## Failure and release observations

| Failed browser | Server CSS finishes before original cutoff | Browser CSS completions at cutoff | First JavaScript receipt after release begins | Directory headers after release begins | Exact payload |
| --- | ---: | ---: | ---: | ---: | --- |
| B1 desktop user 2 | 6 | 1 | 9 ms | 312 ms | Matches |
| B2 phone user 0 | 5 | 0 | 8 ms | 663 ms | Matches |
| B2 phone user 8 | 5 | 0 | 25 ms | 649 ms | Matches |

The 16 received CSS responses finish server-side within 42.739 ms of receipt. Before the original cutoff, all 39 JavaScript request starts lack browser headers and matching server receipts, and no session/directory read starts. All three unchanged ten-second phases still have zero JavaScript completions and no directory response. After release, each browser has 13 completed scripts and eight completed stylesheets. Node finish is operating-system handoff, not browser receipt; the paired observations and intervention locate the supported boundary without claiming packet-level proof.

The fixed phase order and three cases do not establish a failure rate, a Chromium-wide bug, or that every historical stall has the same cause. No full rendered-readiness assertion is made after the intervention. The follow-on decision is to validate an equivalent network-conditioning method independently before a new ten-user performance comparison; changing the app's pool, SQL, authentication or timeouts is unsupported by these pre-API failures. No replacement performance run is included in this increment.

## Integrity and disposition

[Summary](summary.json) retains all four positions, original failures and separate release phases. The [63-file integrity manifest](artifacts.json) preserves original JSON/JSONL bytes losslessly and original PNGs. Every stored/original hash pair verifies and private-value scans pass. The recorded-source `294d130` tools reproduce the summary byte-for-byte and all 59 core manifest entries exactly; four support files complete the manifest. Earlier [asset correlation failures](../asset-correlation/README.md) remain unchanged.

PR #391 remains draft. The application import reduction, source-specific [planner repair verification](../planner-ci-repair/README.md), final combined-head CI, original HTTP 503 cause, performance target, owner acceptance and deployment remain separate facts.
