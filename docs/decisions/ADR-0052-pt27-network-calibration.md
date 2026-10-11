# ADR-0052 — PT-27 network calibration

<!-- versioning: git; committed history is authoritative -->

Status: proposed experimental method; adoption depends on the calibration and application evidence below. Owner: Dean Fiedler. Recorded 11 October 2026. Dean authorised validating equivalent network conditioning and then, only if validated, repeating the ten-user comparison. This authorises the repository experiment, not business acceptance or production operation.

Related: PT-27, NFR-04, D-021, AT-23, CS-01/CS-02; [loading decision](pt27-loading-performance.md), [retained release diagnostic](../testing/evidence/pt27-loading/asset-release/README.md). Preserve all parent IDs and original failures.

## Context and alternatives

Three captured navigations remain stalled under the declared CDP rule and resume when that rule is removed. This locates a dependency without identifying a specific Chromium defect. The existing rule-based method therefore needs independent transfer validation before more application timing conclusions.

Use the existing pinned Chrome, Playwright, Node and disposable CI runner to assess the older `Network.emulateNetworkConditions` global command as a bounded candidate. Chromium's [network handler](https://github.com/chromium/chromium/blob/main/content/browser/devtools/protocol/network_handler.cc) sends both commands through `SetNetworkConditions`; the candidate is an alternative API path, not an independent throttle engine. The [protocol definition](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/domains/Network.pdl) marks the older command deprecated. A passing calibration alone cannot demonstrate that it avoids the app stall or justify durable adoption.

OS packet shaping would provide a more independent mechanism, but per-browser aggregate limits and the current loopback-only server require additional routing/classification or namespaces. A custom proxy would add transport and queueing behaviour needing its own proof. Neither is introduced speculatively here. Changing the pinned browser, removing network limits or increasing deadlines would alter the declared profile and is not selected.

## Predeclared calibration and conditional comparison

Before any new app samples, run one standalone synthetic HTTP calibration on the same four-CPU runner. It has no application/database code or business records. Use exact uncompressed payloads, SHA-256 verification, no-store responses and fixed endpoints. Observe five sequential tiny reads, small/large downloads and uploads, six concurrent downloads sharing one browser's limit, and a navigation with eight stylesheets/thirteen scripts. Preserve server receipt/body/finish observations, browser timing, original errors and every cohort. No retry or replacement cohort.

Fixed order: unthrottled A1, existing rule, global B1, global B2, unthrottled A2; each has one then ten independent browser processes. In ten-browser cohorts, five use desktop and five phone dimensions. All conditioned cases retain 40 ms minimum response latency, 1,250,000 bytes/s download and 625,000 bytes/s upload. Every operation keeps a 120-second failure limit.

Candidate qualification requires both global repeats at both concurrency levels to complete every probe and graph with exact bytes, median tiny-response latency 30–250 ms, small-to-large download/upload duration slopes within ±25% of the declared byte/rate difference, and six-way aggregate download duration within ±25% of its nominal 2.4 seconds. Both unthrottled anchors must complete and their large transfers must stay below 1.5 seconds. These declared tolerances are calibration criteria, not a relaxed application target. The existing-rule cohort remains evidence even if it fails. A missing/failed candidate or anchor blocks app measurement.

Only after that gate passes, run existing-rule / global / global / existing-rule against one compiled build and unchanged seven-table fixture. Keep ten browsers, both viewports, four waves, actual record openings, payload/permission assertions, original deadlines and three-second target. All four positions use the same shared four CPUs, so method is the only planned difference; unlike the previous whole-core diagnostic, there is no mixed CPU allocation. Keep bounded asset observations and the external sampler on throughout, detailed app/database logging off, and no post-failure release intervention. Require the source- and Chrome-version-bound calibration verdict before every candidate run. The global command supplies no per-request rule ID; that lost observation is explicit, never fabricated.

## Consequences and reversal

This adds only opt-in diagnostic scripts and a manual workflow choice. Default comparisons and ordinary PR/main assurance retain their existing behaviour. No application source, endpoint, database, dependency, service deployment or authority changes. A rejected candidate remains recorded and cannot trigger app runs. A passed candidate still needs the conditional application comparison before adoption; source/runner timings are not pooled with history. Removing the manual profile and helpers reverses the experiment without data migration.

## Evidence and disposition

The first source-bound run, `c946745` / Actions `38101774119`, passed the transfer gate but retained six cold phone timeouts in global B1. Global B2 and the rule anchors completed. Reject the global command as a reliable replacement; neither successful configuration nor the small synthetic graph predicts this application's outcome. Original samples remain unchanged.

## Second candidate, declared before implementation

That failed application comparison justifies testing an independent throttle engine. Use Linux's existing `tc` HTB rate classes and netem delay on the disposable CI runner's loopback interface, with one loopback SOCKS5 relay port per browser to classify its aggregate traffic. No package, production service or application endpoint is added. The relay forwards opaque TCP only to the single approved loopback application/calibration port; it does not inspect or retain HTTP headers or bodies. Force Chrome's loopback proxy use. Record relay connection/byte counters and kernel class statistics so successful configuration alone cannot pass the gate.

Each browser receives separate 10 Mbit/s download and 5 Mbit/s upload classes, with 20 ms delay in each direction. These are the same nominal byte rates and 40 ms round trip; packet accounting, TCP acknowledgement/handshake delay and relay overhead differ from CDP response scheduling. Equivalence is bounded by the unchanged transfer criteria, not asserted bit-for-bit. [HTB](https://github.com/iproute2/iproute2/blob/main/man/man8/tc-htb.8) supplies aggregate classes and [netem](https://github.com/iproute2/iproute2/blob/main/man/man8/tc-netem.8) documents timer and TCP placement limitations. Those limitations remain applicable to loopback measurement.

Require Linux, four available CPUs, the explicit manual synthetic CI profile, unused reserved relay ports below the ephemeral range and an original `noqueue` loopback discipline. Refuse unexpected state. Create a uniquely identified owned root; remove only that verified root in cleanup, retaining before/configured/after statistics. Unclassified traffic remains unshaped. Do not modify the developer machine, routes, offload settings or other interfaces.

Calibration order: direct unthrottled A1, unshaped relay A1, packet B1, packet B2, unshaped relay A2, direct unthrottled A2; each has one then ten independent browsers. Retain every outcome, including failures; both packet repeats and all anchors must satisfy the existing exact-byte, slope, aggregate, latency and graph criteria. Require nonzero per-browser relay bytes and traffic-class counts for both directions. No thresholds or 120-second deadlines change. A failure blocks application measurement.

After that gate alone, compare rule / packet / packet / rule on the same compiled build and fixture, with all four CPUs shared in every position, the original ten-browser desktop/phone workloads and three-second target. The relay hop is an explicit method difference and its unshaped anchors bound overhead. Authentication setup remains outside measured actions. Keep default CDP rule behaviour unchanged pending evidence; a completed block is not production or full PT-27 acceptance.

The first packet attempt, `2fce332` / run `38103259965`, stops at the evidence collector: the runner's iproute2 6.1 emits plain class statistics despite `-j`, so JSON parsing fails before any shaped browser launches. All 44 direct/relay anchor samples pass; all four shaped cohorts remain failed with no samples. Every owned root is removed and its original `noqueue` state restored. No build or application sample runs. Preserve that attempt, correct the collector to retain raw class/filter text and strictly parse explicit class byte/packet counters, then run a new complete block with the same order, gates and deadlines. This corrects a harness defect, not a failed rate/latency criterion; no sample is substituted into the original run.
