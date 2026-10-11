# PT-27 global CDP application comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Executed 11 October 2026 Brisbane. Scope: PT-27, NFR-04, D-021, AT-23, CS-01/CS-02. [Predeclaration and disposition](../../../../decisions/ADR-0052-pt27-network-calibration.md).

Reject the global CDP command as a reliable replacement. It passed [independent calibration](../network-global-calibration/README.md), then retained six original cold phone timeouts in B1. B2 and both rule anchors complete. The incomplete block cannot establish a method latency benefit or the cause of the earlier HTTP 503s.

[Run 38101774119](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38101774119), [job 114359007101](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38101774119/job/114359007101), source `c9467450cfb4dac40b46254e079b416f5c2eed58`, build `NeKkgCluvfR3fnezLVZKe`. Chrome 155.0.8059.39, Node 24.21.0, Linux. [CI provenance](ci-provenance.json).

One compiled build and unchanged seven-table fixture; ten independent browsers at 1440×1000 and 390×844, four waves and actual record openings. Rule / global / global / rule, all sharing the same four CPUs. The original 40 ms latency, 1,250,000 bytes/s download, 625,000 bytes/s upload, 120-second deadlines and three-second target remain. Bounded asset observations and external resource sampling remain on; detailed app/database logging and post-failure release probes remain off. The global method has no per-request rule ID, explicitly recorded as null.

| Position | Directory attempts | Passing loads | Cold timeouts | Passing record openings |
| --- | ---: | ---: | ---: | ---: |
| A1 rule | 80 | 80 | 0 | 20 |
| B1 global | 50 | 44 | 6 phone | 10 |
| B2 global | 80 | 80 | 0 | 20 |
| A2 rule | 80 | 80 | 0 | 20 |
| Total | 290 | 284 | 6 | 70 |

The six original failures are phone wave zero, users 1, 7, 2, 5, 0 and 8. Every failure has thirteen JavaScript request starts without corresponding server receipts before its original cutoff. No observed browser HTTP error or HTTP 503 occurs. No retry, release or replacement sample follows. The workflow correctly fails.

All sampled allocations are valid and available memory stays above 10.18 GiB. All positions actually use CPUs 0–3 for service and browser/driver; the root protocol's unused one/three partition fields are inherited descriptive defaults, not the applied allocation. Per-position metadata and sampled thread masks verify the applied shared allocation. The later packet experiment corrects these unused root fields without modifying these original bytes.

Descriptive cold p95 in complete positions is 5.646/6.384/6.366 seconds on desktop and 5.488/5.348/5.123 seconds on phone for A1/B2/A2 respectively. Every cold group remains above three seconds. Missing B1 timing groups stay absent; completed positions are not substituted into a full comparison, and absolute timings are not pooled across runners.

[Summary](summary.json) and [58-file manifest](artifacts.json) retain all four positions and original failures. All hashes and private-value scans pass. Recorded-source `c946745` tools reproduce the summary byte-for-byte and all 54 core manifest rows exactly; four support files complete the manifest. Build and compiled diagnostic smoke pass separately. Final PR assurance and owner acceptance remain separate.

This outcome justified the ADR's independent packet candidate, whose later calibration and app outcomes are recorded separately. Default comparisons retain the existing rule method. PR #391 was draft at this measurement and subsequently merged at `99a0e99`; the network-method follow-up is PR #409. No production or full PT-27 acceptance follows.
