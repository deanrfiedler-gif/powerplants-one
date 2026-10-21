# Sites CS-04 verification

<!-- versioning: git; committed history is authoritative -->

Owner visual review: **pending**. Synthetic fixtures only. Source: PPO - Design, named version **Sites — accepted**, nodes listed in the [page contract](../../../design/development/pages/scope-cs-04.md). The retained design captures are unchanged. No private file link, key or licensed artwork is included.

The current [build record](../../../delivery/sites-cs04-build.md) records executed checks and limitations. Tests are `tests/database/sites-register.test.ts`, `tests/unit/site-reference.test.ts` and `tests/browser/sites-native.spec.ts`. Browser comparisons use deterministic, explicitly synthetic API fixtures in `tests/helpers/sites-native.ts` plus a real API/reference journey. Fixtures never assert P4 confirmation or work authority.

Target viewports: desktop 1440 × 900, tablet 1024 × 900, phones 390 × 844 and 320 × 844; loading, no matches and error at 390. Owner/device acceptance and deployment are separate from these checks.

## Captures and execution

Captured on 21 October 2026 from the running Next.js application using Chrome 155.0.8059.85 and the explicit synthetic shell/read fixtures. Application source: `3ecd0135`; the capture helper additionally waits for the phone navigation and scrolls the partial-source messages into view. The private icon kit was omitted; only repository fallback icons appear. No live business data, credentials, browser traces or reference artwork is retained.

| Composition | Capture | Accepted source node |
| --- | --- | --- |
| Desktop register, 1440 × 900 | [Register](register-1440.png) | 1375:2937 |
| Tablet register, 1024 × 900 | [Register](register-1024.png) | 1375:3449 |
| Phone register, 390 × 844 | [Register](register-390.png) | 1375:328008 |
| Narrow phone register, 320 × 844 | [Register](register-320.png) | Responsive extension of the phone list |
| Desktop record, 1440 × 900 | [Overview](overview-1440.png) | 1375:3183 |
| Tablet record, 1024 × 900 | [Overview](overview-1024.png) | Responsive extension of the desktop record |
| Phone record, 390 × 844 | [Overview](overview-390.png) | 1375:3678 |
| Narrow phone record, 320 × 844 | [Overview](overview-320.png) | 1379:2365 |
| Installed/served equipment, 1440 × 900 | [Equipment](equipment-1440.png) | 1375:3312 |
| Phone loading | [Loading](loading-390.png) | 1375:328046 |
| Phone no matches | [Empty](empty-390.png) | 1375:328103 |
| Phone read failure | [Error](error-390.png) | 1375:328145 |
| Phone filter and visible keyboard focus | [Filter](filters-390.png) | Undrawn shared-control composition |
| Revoked access | [Denied](denied-390.png) | Undrawn explicit read state |
| Partial/unavailable/restricted sources | [Partial](partial-390.png) | Undrawn independent-source composition |

Both fixture journeys passed, including 1440/1024/390/320 layout bounds, exact handovers, equipment grouping, keyboard tabs, modal focus and restoration, retry and clearing previously visible rows on denial. The state-only rerun also passed after capture synchronisation. These fixtures prove presentation and wiring; the real API and database tests remain separate.

Contributor comparison against the privately inspected accepted frames found the following differences: the later accepted compact phone header and current permitted shell navigation; short references on every row, with wrapped dates/readiness text increasing some row heights; explicit P4-unavailable wording; recorded installation groups without an inferred parent building; a shared record breadcrumb that prefers its reference; and current shared empty/error/filter treatments. The restricted/partial states and tablet record are undrawn. The [page contract](../../../design/development/pages/scope-cs-04.md) and [build record](../../../delivery/sites-cs04-build.md) retain the reasons and open owner review. No accepted reference was altered to make a comparison pass.
