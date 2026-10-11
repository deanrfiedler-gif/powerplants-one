# PT-27 first controlled loading block

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026. Synthetic diagnostic; owner/device acceptance is separate.

This is the predeclared main/broad-candidate/broad-candidate/main block after integrating main `6c69d92`. Both application builds were completed before the block and each exact build ID was reused. The diagnostic driver is `9919f55`. Each run retains all 80 directory loads and 20 exact record handovers; all pass. The seven declared fixture tables match before and after every run. Fresh servers and ten independent Chrome processes are used per run; data/OS caches remain. No failed sample was replaced or excluded.

## All per-run p95 outcomes

Seconds; nearest-rank p95. Cold/record n=10, warm n=30 per run and viewport.

| Run | Desktop cold | Desktop warm | Desktop record | Phone cold | Phone warm | Phone record |
|---|---:|---:|---:|---:|---:|---:|
| abba-a1 | 14.319 | 4.944 | 9.753 | 8.745 | 4.994 | 6.743 |
| abba-b1 | 16.428 | 4.621 | 13.415 | 12.300 | 4.364 | 6.882 |
| abba-b2 | 16.511 | 5.933 | 8.315 | 7.275 | 2.710 | 5.140 |
| abba-a2 | 20.928 | 7.590 | 7.816 | 6.237 | 4.216 | 5.851 |

See [summary.json](summary.json) for medians, ranges, pooled results, sources/build IDs, phase diagnostics and limits. Main emits 847 and 1,029 observed speculative requests; both broad-candidate runs emit zero. The cold-phone loss appears in both paired comparisons: 8.745 to 12.300 seconds, then 6.237 to 7.275 seconds. The broad policy is therefore not adopted.

## Diagnosis and disposition

The candidate downloads essentially the same script/style/font payload as main. The earlier original-pair script bytes differ by only 14 bytes. Large timing variation appears before the directory GET and in asset completion. In this block, candidate cold-phone script completion median varies from 5.675 to 3.672 seconds. The first candidate has a 2.338-second median gap between core response headers and processing JSON, while its directory gateway median is 0.474 seconds. The readiness path includes browser/driver delivery and processing; that gap is not a measured database duration. The after-JSON-to-ready median is 0.448 seconds. Some font requests remain incomplete at the snapshot and are explicitly counted.

Both candidate and main vary substantially across repeats. This shared-host evidence does not isolate a browser, operating-system or network-service root cause. It is sufficient to reject a claim of overall improvement from the broad policy, not to blame every millisecond on prefetch. Keep the measured three-second target and all old failed/partial attempts unchanged.

The next candidate narrows the application change to desktop rail Home, rail destinations and desktop More. Shared header, breadcrumbs and phone links return to their prior loading policy. The separately declared [narrowed block](../narrowed-repeat/README.md) retains its unsuccessful result and final draft disposition. This record remains the broad candidate's original execution, not the narrowed candidate's result.

Stored and original hashes are in [artifacts.json](artifacts.json). Verification logs and host memory snapshots are added with the continuation handover. No production, hosted or physical-device acceptance is inferred.
