# Customers gateway timing evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 8 October 2026. Follow-on to the [loading experiment](../customer-loading-diagnosis/README.md), under the [same quality decision](../../../decisions/customer-loading-diagnosis.md). Instrumentation source `f9246e51c59d17b17171bf747a2c0473abcfc74d`; unchanged compiled application `24d19b1`, build `bXz2zLSgUTZhicOrJw-F3`. No application permission, query, workflow or hosted-gateway change.

## Collection and verification

The existing opt-in loopback diagnostic records bounded gateway request events and runtime samples. A generated numeric response header on uncached API requests links browser timing to the specific server request. It is absent by default, absent on pages/assets, and added only after gateway checks. Client labels are ignored. No credentials, identities, request bodies or full headers are collected.

The driver reuses the same synthetic seven-table fixture, compiled build, 10-browser/four-wave desktop/phone method, unchanged core endpoint, deadlines and readiness boundary. Browser Performance time origin is retained separately from CDP-relative request time and gateway wall-clock timestamps. All 80 navigations passed exact authorised content and rendered-name checks with one directory request each and unchanged before/after fingerprints.

All 80 local-session and 80 directory reads match 160 distinct numeric gateway IDs, each with exactly one received event and a successful 200 finish. The gateway captured 2,651 received events, 2,293 finished events and 358 closed-incomplete events. Every received ID has one terminal event in this capture; none remains censored. The closed-incomplete events are outside the matched session/directory reads and are not classified as failed user tasks.

The correlation HTTP check passed with diagnostics off and on. The first on check ran before the server was listening and failed with ECONNREFUSED; after an explicit readiness check, the unchanged test passed. Both attempts remain. Targeted lint and full typecheck passed. No timeout was reproduced in the 80-navigation diagnostic; this does not resolve the earlier unsuccessful repeat.

## Findings and limits

Desktop cold medians: the session request begins about 3.77 seconds after navigation; its browser response takes about 1.73 seconds, versus 0.633 seconds inside the measured gateway callback. The directory response takes about 0.814 seconds in the browser, versus 0.571 seconds inside the gateway. Warm desktop session gateway medians are about 0.067/0.077/0.095 seconds. [Matched request rows](matched-requests.csv) and [all grouped results](summary.json) preserve exact values. `browser_response_ms` is CDP request-start through loadingFinished; `browser_request_start_ms` is relative to that navigation's CDP Document request. These are distinct from Resource Timing measurements.

The delay therefore spans work before the session request and time outside the measured gateway handler, as well as server work. Gateway elapsed time is not SQL execution time. This run does not identify a particular query, component or background request as the cause.

Sixteen runtime samples record a minimum of 0.085 GiB free memory, median 0.566 GiB, and four samples below 0.3 GiB. Median event-loop-active time is 100%, while process CPU divided by elapsed time is about 69.15%. Event-loop-active time is not equivalent to CPU saturation; synchronous diagnostic writes and host scheduling also affect the measurement. These observations describe this constrained local run and do not establish the cause of the earlier uninstrumented timeout.

Diagnostic desktop/phone p95 is 7.237/4.288 seconds. Instrumentation and host conditions prevent treating these as a new cache comparison or target-acceptance result. Further local ten-browser repetitions are not justified by this evidence. The subsequent CI comparison and request classification below retain their own sources. No change to identity, database or shell behaviour follows solely from this run.

## Separate CI comparison

The retained [CI comparison](ci-comparison.json) identifies #371 head `8b1a389` and #372 head `4885fb7`, their actual executed trees/builds, performance jobs and artifact IDs. Each job completed 320 samples per profile with zero request failures. Development missed all 16 timing groups in both jobs; compiled missed 16/16 before the cache change and 13/16 after it. A successful measurement job does not mean the candidate timing target passed.

| Compiled Customers p95 | #371 before cache correction | #372 cache correction |
|---|---:|---:|
| Desktop first wave | 6.250 s | 6.430 s |
| Desktop repeat waves | 4.785 s | 3.254 s |
| Phone first wave | 4.192 s | 4.448 s |
| Phone repeat waves | 3.977 s | 2.677 s |

All 80 Customers samples in each job retain complete CDP byte fields for 23 JS/CSS resources. #371 transferred 359,067 bytes every wave. #372 transferred 359,481 bytes on fresh visits and zero on every repeat visit. This confirms the cache behaviour in CI. The times come from separate jobs/runners and are not a controlled causal estimate of whole-page improvement. First loads and desktop repeats still miss the unchanged three-second candidate target. CI's minimum free memory was 9.845/9.784 GiB respectively, so constrained local memory does not explain away the broader performance gap or establish the cause of the earlier local timeout.

The gzip CI files preserve exact downloaded JSON/JSONL bytes, with original artifact paths and uncompressed hashes in the comparison. Server-profile metadata binds each retained diagnostic process to its compiled build. CI builds differ from the local build; neither measurement establishes hosted performance.

## Integrity and remaining work

The subsequent [single-browser classification](prefetch-classification.json), source `77d91b6`, confirms explicit Next/purpose-prefetch flags on 65 of 100 observed desktop requests and 34 of 69 phone requests. Twenty-one desktop and all 34 phone prefetch requests started before readiness. Each viewport made exactly one directory read and preserved its exact content. The probe uses one fresh context per viewport, no network emulation, and an explicit one-second post-ready observation. It records only boolean header flags and paths, not full headers or query values. Counts describe that bounded observation; they are not ten-user timings, all future requests, or proof that suppressing prefetch will improve page or next-navigation latency.

Exact customer-record paths account for 28 desktop prefetch requests across 12 records (three before readiness) and nine phone requests across three records (all before readiness). The remaining classified requests include shell destinations, directory tabs and New. Suppressing record links alone would not address most observed desktop pre-ready prefetch. The retained harness keeps a mutable requests array until context closure; independently checking every recorded timestamp confirms that this run contains no event beyond its declared observation end. A future probe should detach its listener at the boundary.

[verification.json](verification.json) binds six source blobs and the artifact hashes. The gzip files reproduce the exact complete browser JSON and gateway JSONL; their uncompressed hashes are also recorded. Logs redact the private checkout path. Earlier loading evidence and its unsuccessful repeat remain unchanged.

The wider performance target, cold-load cause, earlier phone timeout, hosted runtime and owner/device/accessibility acceptance remain open. This is diagnostic evidence, not a merge or deployment decision.
