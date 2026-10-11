# PT-27 global CDP calibration

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Executed 11 October 2026 Brisbane. Scope: PT-27, NFR-04, D-021, AT-23. [Predeclared method](../../../../decisions/ADR-0052-pt27-network-calibration.md).

All 55 original browser samples pass the standalone transfer checks, including both global-command repeats and both unthrottled anchors at one/ten-browser concurrency. This qualified the conditional application experiment; it did not establish application reliability. The [subsequent app comparison](../network-global-comparison/README.md) rejects the candidate after six cold phone timeouts.

[Run 38101774119](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38101774119), source `c9467450cfb4dac40b46254e079b416f5c2eed58`, Chrome 155.0.8059.39, Node 24.21.0, Linux, four CPUs. [CI provenance and artifact digest](../network-global-comparison/ci-provenance.json). Calibration passed; the overall workflow failed on the application samples.

Order: unthrottled A1, original rule, global B1, global B2, unthrottled A2; each has one then ten independent Chrome processes. Ten-browser groups use five desktop and five phone viewports. The existing 40 ms latency, 1,250,000 bytes/s download and 625,000 bytes/s upload remain unchanged. Every sample loads eight CSS and thirteen JS resources, reads five tiny responses, verifies exact SHA-256 payloads for small/large downloads and uploads, then downloads six concurrent 500,000-byte responses. Original 120-second deadlines remain.

| Global sample group | Median tiny response range | Download slope range | Upload slope range | Six-way aggregate range |
| --- | ---: | ---: | ---: | ---: |
| B1, one and ten browsers | 42.9–51.4 ms | 1,809.1–1,908.0 ms | 1,813.0–1,891.7 ms | 2,454.4–2,555.7 ms |
| B2, one and ten browsers | 42.9–52.7 ms | 1,810.7–1,917.3 ms | 1,813.4–1,854.2 ms | 2,455.3–2,541.5 ms |

Declared gates are 30–250 ms tiny-response median, ±25% of the nominal 1,800 ms upload/download slopes, ±25% of the 2,400 ms aggregate transfer, exact payload/graph counts, and unthrottled large transfers below 1,500 ms. These are instrument-calibration tolerances; the application target stays three seconds. The original rule also passes all eleven samples. This synthetic graph does not reproduce the app stall, and both CDP commands share Chromium's throttle engine.

[Summary](summary.json) and [57-file manifest](artifacts.json) retain every original sample, protocol and allowlisted server event losslessly. All stored/original hashes and private-value scans pass. The `e4d3cd0` summarizer reproduces the summary and every manifest row exactly from the original `c946745` measurements. No retries, substituted samples, application/database records or inferred missing observations.
