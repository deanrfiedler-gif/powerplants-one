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

Pending execution. Calibration, application outcomes, CI assurance, owner acceptance and deployment will be recorded separately. No result is inferred from successful configuration commands.
