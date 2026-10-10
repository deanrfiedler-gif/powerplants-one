# PT-27 narrowed loading comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026 (Australia/Brisbane). Synthetic diagnostic; independent review and owner/device acceptance remain separate.

**Disposition: keep PR #391 in draft. Neither trial establishes an acceptable overall performance improvement.** The broad policy is rejected after the [first controlled block](../controlled-repeat/README.md). The narrower desktop-rail policy reduces observed desktop speculative requests, but its completed run has slower cold loads and record openings, and its repeat fails readiness. Retain the narrowed code only as a reviewable experiment; do not adopt it as a performance fix or close PT-27.

## Declared method and every outcome

The separately declared `20261010-main-narrow-final-abba` block uses driver `a8549a1b507ad5655ab5bddd2ad7321ca89f21d9`, ten independent Chrome processes, the same synthetic fixture, desktop/phone widths and throttling, and unchanged startup/readiness deadlines. Main source `6c69d92b8fd0913de916587f6e4cabb358868f11` uses build `qThSo3tITjqcT7DkJfgP0`; narrowed source `7fd9c0f62932387c2855139dc839bc2f7ec1560d` uses `GU6LjRhU6f0CkwLvJ6VuS`. Each source is compiled once and its exact build reused. Fresh servers/browser processes are used per run; OS/database caches and other host activity remain. The earlier [interrupted narrowed block](../interrupted-narrow/README.md) is retained separately, with no replacement samples.

| Position / run | Outcome |
|---|---|
| 1 — narrow-final-a1, main | All 80 directory loads and 20 actual record handovers pass; fixture unchanged. |
| 2 — narrow-final-b1, narrowed | All 80 directory loads and 20 actual record handovers pass; fixture unchanged. |
| 3 — narrow-final-b2, narrowed | First desktop cold wave has 10 samples: 4 succeed and 6 fail the existing 120-second response wait. No subsequent waves or record visits are substituted. |
| 4 — narrow-final-a2, main | Compiled server exceeds the existing 120-second startup limit; zero samples. Original error remains visible after cleanup. |

This is **not a successfully completed comparison block**. [summary.json](summary.json) records `completed_block: false` and `pooled: null`. No percentile is calculated from the four successful samples of the failed wave. `--retain-incomplete` authorises retention only; it cannot label failures successful or create pooled timing results. The final read-only fixture check matches all seven original table fingerprints. Missing per-run after-fixtures and captures for failed attempts are explicit, and their logs/results remain retained.

## Descriptive timings of the two completed runs

Seconds; nearest-rank p95. Cold/record n=10 and warm n=30 per viewport. These two rows do not substitute for the failed repeats.

| Run | Desktop cold | Desktop warm | Desktop record | Phone cold | Phone warm | Phone record |
|---|---:|---:|---:|---:|---:|---:|
| Main a1 | 15.711 | 8.081 | 11.355 | 12.789 | 4.241 | 7.433 |
| Narrowed b1 | 30.533 | 6.345 | 13.013 | 16.476 | 4.946 | 12.658 |

All six narrowed groups miss three seconds. Observed speculative requests in the completed run fall from 420 to 217 on desktop and vary from 399 to 387 on phone. Counts use the retained `next-router-prefetch` header observation. The shared header, breadcrumbs and phone still use the prior policy, so zero total prefetch is no longer the intended contract. Cold-phone script completion median rises from 4.672 to 7.465 seconds despite the phone retaining that policy. This shows why request reduction alone is insufficient evidence of improved readiness.

## Failure boundary and next diagnostic target

The failed narrowed repeat records six `/api/v1/local-session` responses and one `/api/v1/shell/context` response with HTTP 503. The six failed users never receive the required Customers directory response. Their session gateway durations are 5.490–5.842 seconds; the shell-context failure is 4.473 seconds. The launcher logs the normal `DependencyUnavailable` classification. This identifies a concrete failure before directory readiness, not a measured SQL duration or a proved connection-pool cause. The existing diagnostic records detailed transaction phases only for report/job reads, so it cannot isolate session acquisition, query work or event-loop delay here. PostgreSQL's task-owned log contains no ERROR/FATAL/WARNING entries for this run.

The final main startup failure and variable asset timings establish additional shared-host reliability limits; they do not prove the same cause as the 503 responses. The next bounded engineering target is phase-level diagnosis of these session/context reads under the same ten-user cold load, with an unchanged-main reproduction before attributing a regression or changing pool limits. Preserve authority checks and the current failure/readiness boundaries. No timeout, retry, identity cache, pool limit or font policy is changed in this contribution.

## Regression checks and review boundary

The final narrowed compiled build passes 14 selected desktop/phone browser checks and 23 focused units; type/lint/build and repository assurance are recorded in [verification.json](verification.json). These pass independently of the failed load trial. They cover exact People/record receiving and Back, identity-specific workspace navigation, dirty preferences, saved views, keyboard/touch and read-only refusal. They do not constitute a full local browser/database suite pass.

The initial narrowed smoke test incorrectly treated shared-header prefetch of overlapping paths as a rail failure. Its original failed log and path-only request capture are retained. The corrected test requires zero speculative requests for rail-only destinations and proves the hovered People link is in that set; unchanged header paths remain visible in the capture. Both phone touch and desktop keyboard scenarios pass. This is a scope correction; no business/readiness assertion was relaxed. The missing-gateway cleanup repair is also exercised by the final main startup failure, which retains the original error and stops the owned process.

Desktop and phone Customers captures from the corrected smoke run were inspected for readable content and expected controls. Geometry, fonts, icons and issued references are unchanged. The 28 stale visual reviews are preserved; no owner, physical-device, accessibility, hosted or deployment acceptance is inferred. The original four-view sampler stall remains open.

All run results, gateway observations where available, host snapshots, logs and captures have stored/original hashes in [artifacts.json](artifacts.json). Cookies, credentials, full request headers and raw browser traces are not published.
