# PT-27 packet-shaping calibration

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Executed 11 October 2026 Brisbane. Scope: PT-27, NFR-04, D-021, AT-23. [Method and unchanged gates](../../../../decisions/ADR-0052-pt27-network-calibration.md#second-candidate-declared-before-implementation).

All 66 browser samples pass: 22 shaped samples and 44 direct/unshaped-relay anchors across twelve cohorts. This qualifies the conditional [application comparison](../network-packet-comparison/README.md) for the recorded synthetic profile. The earlier [collector failure](../network-packet-setup/README.md) remains failed and separate.

[Run 38104072388](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38104072388), source `beb4d0c5eaa77a8fcef8d03a8b6ac76787cfd4e3`, Chrome 155.0.8059.39, Node 24.21.0, Linux kernel 6.17.0-1022-azure, iproute2 6.1.0, four CPUs. [CI provenance](../network-packet-comparison/ci-provenance.json). Calibration passes; the overall workflow fails later on two original-rule control timeouts, not the packet-shaped app repeats.

Order: direct A1, unshaped relay A1, packet B1, packet B2, unshaped relay A2, direct A2; each has one then ten independent browsers. Ten-browser cohorts split five desktop/five phone. Each browser has its own loopback SOCKS port and aggregate 10 Mbit/s download, 5 Mbit/s upload classes, with 20 ms delay each way. No CDP request throttling is installed in packet samples; navigator network state remains declared consistently.

Every sample completes the eight-CSS/thirteen-JS graph, five tiny reads, exact SHA-256 small/large downloads and uploads, and six simultaneous 500,000-byte downloads. Both unshaped relay anchors also meet the original unthrottled transfer limits. Both packet repeats meet all unchanged latency, slope and aggregate gates at both concurrency levels.

| Packet sample group | Median tiny response range | Download slope range | Upload slope range | Six-way aggregate range |
| --- | ---: | ---: | ---: | ---: |
| B1, one and ten browsers | 41.7â€“49.1 ms | 1,842.5â€“1,906.3 ms | 1,654.5â€“1,864.1 ms | 2,360.8â€“2,556.0 ms |
| B2, one and ten browsers | 41.8â€“46.1 ms | 1,794.4â€“1,911.9 ms | 1,667.5â€“1,879.1 ms | 2,354.6â€“2,601.6 ms |

Nominal upload/download slopes are 1,800 ms and nominal aggregate transfer is 2,400 ms, each with the predeclared Â±25% calibration band. Tiny-response medians must be 30â€“250 ms. Original 120-second operation limits and the application's three-second target remain unchanged.

Every shaped browser has observed bytes/packets in both kernel classes and at least 1,375,000 uploaded / 5,750,000 downloaded relay bytes. All observed classes have zero drops; all eight relay setups restore the original `noqueue` state. Raw class/filter text, parsed counters, qdisc state and relay counters remain in the traffic files.

The packet/TCP model, relay hop and shared runner differ from CDP response scheduling. Other loopback traffic uses an undelayed 10 Gbit/s fallback class, not a literal bypass; its counters show overlimit events even in calibration. These are not dropped packets, but prevent a zero-overhead or unrestricted-other-traffic claim. Calibration establishes the specified transfer bands, not identical transport scheduling or physical-device equivalence.

[Summary](summary.json) and [76-file manifest](artifacts.json) retain all original samples, protocol, server events and eight traffic records losslessly. No retries, replacement cohorts, relaxed thresholds or extrapolated observations. Qualification is bounded to this opt-in synthetic profile and must be re-established by the source/browser-bound gate on future runs.

All stored/original hashes and private-value scans pass. The `beb4d0c` summarizer reproduces the summary byte-for-byte and every manifest row from the original download.
