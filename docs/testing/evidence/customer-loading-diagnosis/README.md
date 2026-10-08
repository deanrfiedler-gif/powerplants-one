# Customers loading diagnosis evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 8 October 2026. [Decision and boundary](../../../decisions/customer-loading-diagnosis.md). Based on draft photo PR #371 at `0de7ae76`; the compiled application remains `24d19b1f158efeb8ad97d62b50e516cbdac4d80e`, build `bXz2zLSgUTZhicOrJw-F3`. Only the local launcher cache policy changes; no hosted gateway or application module changes.

## Method

Ten Chrome processes, four navigation waves each, desktop 1440×1000 then phone 390×844; 40ms emulated latency, 1.25MB/s download and 625kB/s upload. A fresh additive synthetic fixture reaches 1,000 organisations, 5,000 assets and 10,000 appointments. This fixture is separate from the earlier PQ comparison. No reset occurs between these measurements. Each complete run checks exact authorised response content, rendered customer names, exactly one core directory request and equality of all rows in seven declared fixture tables before/after. Session/login audit activity is outside those fingerprints; no whole-database equality is inferred.

Readiness remains navigation start → core JSON received → identity settled and enabled → no loading/error state → two animation frames. Resource Timing, CDP request timing and browser long tasks supplement that existing boundary. Browser Performance Timeline, CDP-relative Document time and Node timing are labelled separately. No core endpoint, target or response/readiness deadline was relaxed. Complete raw timelines are deterministic gzip archives of the original JSON; use standard gzip to inspect them. [Summary](summary.json) and [per-wave CSV](waves.csv) remain directly readable.

## Results and source identities

| Run | Source and distinction | Desktop p95 | Phone p95 |
|---|---|---:|---:|
| Original measurement | `eccf98e`; original launcher | 9.917 s | 4.705 s |
| Initial candidate | `5e8a428`; cache exception | 5.341 s | 2.520 s |
| Reversal control | `d3b5875` driver; launcher temporarily restored to exact `eccf98e` Git bytes; actual launcher SHA retained | 4.321 s | 2.845 s |
| Candidate confirmation | `c1519ba`; restored candidate launcher; stronger failure retention | 4.421 s | 2.469 s |

Each complete row contains 80 successful navigations and equal before/after fingerprints: 320 completed samples in these four runs. They are ordered observations, not randomised causal estimates. The intervening unsuccessful repeat is excluded from this complete-run count and retained below.

Confirmed cache result: original and reversal runs transfer 359,067 CDP encoded-data bytes of static chunks on every wave. Candidate runs transfer 359,481 on the fresh-context wave and zero on repeat waves. The header overhead differs after the policy change; the original JavaScript/CSS encoded body content is 346,898 bytes. CDP encodedDataLength includes response overhead and is not the same metric as Resource Timing encodedBodySize.

Final candidate repeat-wave ready medians are 1.448/1.555/1.428 seconds on desktop and 1.204/1.220/1.166 on phone; reversal medians are 2.444/2.246/2.187 and 2.397/2.646/2.362. Cold-load and server/order variability remain substantial. The final desktop p95 still misses three seconds and is slightly slower than the reversal p95. These measurements support avoiding repeated static transfers; they do not establish that caching explains the initial whole-page delta or that PT-27 is complete.

Every original sample has one local-session request and two shell-context requests. Some first shell reads and prefetches are aborted; these network events are retained separately from successful core responses. Most delay occurs before the directory request. Long-task timing does not support attributing that delay to browser CPU, SQL or a particular server subsystem. No speculative session/directory/shell change was bundled into this experiment.

## Header and request assurance

[Original headers](headers.json) confirm no-store for all 23 successful observed JS/CSS assets. [Candidate headers](headers-candidate.json) confirm immutable public chunks while authenticated identity, directory and exact submitted PNG responses remain private/no-store. The retained HTTP test checks successful GET/HEAD/query-bearing chunk responses; private authenticated API/page responses; missing JS/CSS/maps; encoded traversal; unsafe method; and rejected gateway/origin requests. Existing security headers remain.

The initial narrower HTTP proof passed. The expanded proof first failed because its authenticated directory request omitted the required `kind`; the corrected request passed without changing application validation. Lint and typecheck results are retained. No application rebuild is claimed or needed: all timed runs reuse the exact compiled build, with launcher and diagnostic source identities recorded separately.

## Unsuccessful repeat and remaining boundary

Between reversal and confirmation, `candidate-repeat` at `d3b5875` completed four desktop waves and a screenshot, then hit the unchanged 120-second core-response timeout during the phone phase. The log and desktop screenshot are retained. That driver wrote full JSON only at completion, so it did not retain the in-memory sample/network data for this failed run. Its cause remains unresolved; no baseline reproduction, environment-only diagnosis or screenshot-root-cause claim is made.

The driver now attaches response-promise rejection handling immediately, checkpoints completed waves, and retains per-sample network/screenshot failures. Screenshot capture is bounded separately; core/readiness deadlines and content assertions are unchanged. The successful confirmation does not erase the unsuccessful run. No arbitrary repeat-until-pass claim is used.

Remaining work: diagnose cold/pre-directory delay and the timeout with retained server-phase and browser evidence; evaluate redundant shell/prefetch work separately; measure hosted behaviour separately; complete owner/device/accessibility acceptance. No hosted speedup, full reliability pass, merge or deployment follows from this draft.

## Integrity

[verification.json](verification.json) records committed source blobs and artifact hashes/byte counts. Raw gzip archives preserve every original complete-run JSON, including source identities and before/after fingerprints; [summary.json](summary.json) also records uncompressed hashes. Evidence logs normalise LF and redact the private checkout path. The application baseline and original issued sources remain unchanged.
