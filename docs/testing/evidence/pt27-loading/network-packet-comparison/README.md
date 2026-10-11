# PT-27 packet-shaping application comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Executed 11 October 2026 Brisbane. Scope: PT-27, NFR-04, D-021, AT-23, CS-01/CS-02. [Predeclared method](../../../../decisions/ADR-0052-pt27-network-calibration.md).

Both packet-shaped app repeats pass all 160 directory loads and 40 actual record openings after [66 calibration samples pass](../network-packet-calibration/README.md). The final original-rule control retains two cold phone timeouts. The packet method is qualified for this bounded synthetic diagnostic profile; this incomplete block does not establish a latency improvement, a general failure rate or the cause of the historical HTTP 503s.

[Run 38104072388](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38104072388), [job 114365748149](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38104072388/job/114365748149), source `beb4d0c5eaa77a8fcef8d03a8b6ac76787cfd4e3`, build `hQ6KtXsY2eu3uhPdcyKFX`. Chrome 155.0.8059.39, Node 24.21.0, Linux. [CI provenance](ci-provenance.json).

One compiled build and unchanged seven-table fixture; rule / packet / packet / rule; ten independent browsers at 1440Ã—1000 and 390Ã—844, four waves and actual record openings. Every position shares CPUs 0â€“3, with identical bounded asset observations and external sampling. Detailed app/database logging and post-failure interventions remain off. The nominal 40 ms latency, 1,250,000 bytes/s download, 625,000 bytes/s upload, original 120-second deadlines and three-second target remain.

| Position | Directory attempts | Passing loads | Cold timeouts | Passing record openings |
| --- | ---: | ---: | ---: | ---: |
| A1 rule | 80 | 80 | 0 | 20 |
| B1 packet | 80 | 80 | 0 | 20 |
| B2 packet | 80 | 80 | 0 | 20 |
| A2 rule | 50 | 48 | 2 phone | 10 |
| Total | 290 | 288 | 2 | 70 |

A2 phone users 7 and 1 fail in wave zero at their original deadline. Each has thirteen JavaScript request starts with no matching server receipt or browser completion before the cutoff; the server finishes six/five CSS responses respectively. There is no observed browser HTTP error or HTTP 503. These two original failures remain failed, and the workflow correctly fails. No release, retry or substitute sample follows.

All 127,658 sampled thread-mask checks satisfy the declared allocation. Available memory stays above 10.20 GiB. Both packet repeats retain matching post-run fixture fingerprints, observed bidirectional traffic for all ten relay/kernel class pairs, zero class drops, and restoration to `noqueue`.

| Packet repeat | Desktop cold p95 | Desktop warm p95 | Desktop record p95 | Phone cold p95 | Phone warm p95 | Phone record p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| B1 | 6.481 s | 2.840 s | 3.353 s | 4.264 s | 2.505 s | 2.964 s |
| B2 | 5.164 s | 2.747 s | 3.416 s | 4.577 s | 2.458 s | 2.907 s |

Six of twelve packet timing groups meet three seconds; every cold group and both desktop record groups still miss it. The median fraction of cold readiness before the directory request is 74.2â€“77.5% on desktop and 68.5â€“71.0% on phone, with sampled whole-run CPU medians of 96.0â€“96.9%. This supports investigating startup work before the core read; it does not isolate hydration, session logic, database execution or host scheduling. Raw CDP finish-minus-header values can be negative in packet samples too and remain unsuitable as physical transfer durations. No pool, query, authentication or timeout correction follows.

Packet accounting includes TCP/handshake delay and a relay hop. Other loopback traffic uses an undelayed 10 Gbit/s fallback class; its 4,724/4,652 recorded overlimit events in B1/B2 prevent treating it as an unrestricted bypass. No drops are observed, but neither zero queueing overhead nor an application speedup is claimed. The missing A2 timing groups remain absent; do not pool across runners or substitute the successful A1 control.

[Summary](summary.json) and [60-file integrity manifest](artifacts.json) retain the complete block, both original failures and kernel/relay records. The 56 core files are supplemented by four review/fixture/smoke support files. Calibration, build and compiled diagnostic smoke pass separately. [Assurance and prior complete CI](../network-assurance/README.md) remain distinct from final delivery-head CI and owner acceptance.

All stored/original hashes and private-value scans pass. The `beb4d0c` tools reproduce the summary byte-for-byte and all 56 core manifest rows. Both observed and final class-drop counters are zero; cleanup state is verified from the originals.

Use the packet method for the next explicitly calibrated synthetic startup investigation, retaining its source/browser gate and limits. Default comparisons remain unchanged. PR #391 merged at its previously checked `99a0e99` head; this network-method follow-up is PR #409. The three-second target, full PT-27, original 503 attribution, owner/device/accessibility acceptance and deployment remain open.
