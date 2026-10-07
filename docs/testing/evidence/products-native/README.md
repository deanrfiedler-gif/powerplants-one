# Native Products verification evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation review: Codex, 7 October 2026. Owner acceptance, physical-device/screen-reader acceptance, merge and deployment remain separate.

## Completion source and environment

[PR #358](https://github.com/deanrfiedler-gif/powerplants-one/pull/358) reconciles the original unfinished implementation with main `58679be051d8dc8da4356a714fb0f37d09902092`. The integrated source `f9c3fc61f558bda15e73cb76188f2d914cd21b72` and build `hRnXovuyfXzWYOWZQft2a` underpin database, HTTP, restart and visual proof. Final application source `57204c6c3458cad549c68d04d5494e7ca0d616ff` and build `QLKdHIBDrfM_mPxAhYE3F` add the pricing-journal correction and its focused unit/browser proof. That correction changes no database, server command, permissions or layout code. The original checkout's 136 inventoried files remain byte-identical. Issued references are unchanged.

Main advanced to `95722ba8839ed314962a87006b64302f294eca02` when PR #355 merged at 22:28:11 UTC on 6 October (7 October Brisbane). The branch incorporates that reviewed Chrome 155 guard and its tests, preserving both status entries. Products runtime, schema, permissions and tests are unchanged by the integration. Earlier proof retains its exact source/build; all 12 focused browser-guard and Products/navigation units, focused lint, the design register and installed Chrome 154 check pass after integration. Fresh final-head CI remains pending and is not inferred from earlier local passes.

Local execution used Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and supported Chrome 154.0.8037.98. Two isolated loopback clusters used only `ppo_synthetic_test`: one for serial regression, one for HTTP/browser/restart proof. Both use the repository's existing 256 lock-slot setting. Document evidence is outside Git. No hosted or operational data was used.

## Executed verification

| Check | Result and boundary |
| --- | --- |
| Focused Products/navigation units | 10 passed after the final journal repair, including persisted exact-target restoration and refusal of unrelated/external targets. |
| Products database/access/integration/upgrades | 12 passed across the domain/integration/upgrade run and clean access rerun. Includes exact grants, concurrent immutable history, original receipts and upgrades from 0025, 0048 and installed 0071. |
| Compiled HTTP | Passed every Products read/command route, exact replay, independent review, denied and unavailable scope. Rerun against the reviewed build passed. |
| Compiled browser | The integrated source's 12 cases passed across the full run (11/12) and unchanged isolated phone rerun (1/1). Final source then passed all eight affected desktop/phone command journeys, including a lost source-binding response, receipt recovery and the exact saved revision. The earlier screenshot-protocol failure remains recorded below. |
| Actual restart recovery | Passed: 15 original operations, three app processes and two actual PostgreSQL restarts; all 13 retained table projections and original receipts/replays unchanged. See the three `restart-*.json` records. |
| Wider database regression | All 61 distinct cases have passing evidence: initial serial run 60/61, then the unchanged timed-out case passed 1/1 in isolation. Estimating/workspaces, Field timer, Scheduling policy, Products access, quality and hosted-upgrade cases are covered. The same isolated case passed on unchanged main; the original timeout remains recorded in `regression-summary.json`. |
| Full unit suite | 605 of 608 passed. The same three document-store/recovery failures reproduce on unchanged main `58679be` under Windows: two `ExactDocumentUnavailable` path checks and one recovery-directory message assertion. They are not counted as passes. |
| Build, types and lint | Compiled build and TypeScript passed; whole-repository lint and focused checks after subsequent edits passed. Final local build used two workers to limit memory pressure. |
| Design register | Passed: 336 entries, 182 routes, 37 component entries; review fields remain unaccepted. |
| Access-review contract | Passed: 122 capabilities and the existing 31-capability hosted set; Products family labels and generated source hash agree. |
| Documentation and existing UI baselines | Foundation, prototype and naming checks passed; six existing accepted baselines passed 24 viewport captures. Products observations below are a separate proposed adaptation. |

Private task logs retain complete commands and failure diagnostics; public summaries contain no session credentials or connection configuration.

## Visual observations and proposed departures

Retained Products r04 and Supplier Pricing r01 were rendered independently at 1440, 1024, 720, 390 and 320 CSS px. `reference-sources.json` records their exact source hashes. The paired native test additionally measures r22 and r04 against the compiled application; it records heading font/size/colour, overflow, keyboard disclosure and visible focus. Native forms retain 16 px inputs and 44 px phone buttons. Capturing an image does not grant acceptance.

Implementation inspection covered all six desktop surfaces and representative 390/320 px phone surfaces. Navy/green tokens, Roboto/Verdana, white bordered panels and clear revision/state labels are retained within the current shared shell. Native cards replace r04's dense product table; publication, compatibility and import use proposed house forms because PD-02/04/05 have no dedicated accepted HTML. Pricing uses existing ES-03 AUD/excluding-tax evidence; the wider multi-currency pricing preview is not claimed as implemented.

Phone navigation and facts stack without outer horizontal overflow. Long identifiers wrap; internal product/revision/company UUIDs sit in an optional disclosure. Inspection found its focus outline touching the revealed line; the reviewed build adds space below open disclosures. The [completion manifest](completion-manifest.json) records all 45 capture hashes and the 17 explicitly inspected images, including the repaired focused disclosure at desktop, 390 and 320 px. Owner baseline approval remains pending; no accepted fingerprint is manufactured.

## Retained failed attempts and limits

- The first fresh reset reached PostgreSQL's default lock-slot limit while dropping the actual-main schema, before Products ran. Using the repository's established 256-slot test setting resolved it. One subsequent access setup overlapped a cluster restart and lost its connection; the clean rerun passed.
- Initial integration checks caught a missing Products family label, a readonly-array TypeScript assertion and project-instruction length above 8,000 characters. All were corrected and their checks passed.
- The first HTTP/browser invocation preceded compiled-server readiness and failed with connection refused. Readiness was established before rerunning; those failed starts are not application passes.
- The first ready browser run passed 10/12. Both failures attempted to fill a collapsed compatibility form. The test now opens the actual disclosure before editing; no product guard was weakened.
- The reviewed-build full browser run passed 11/12. The phone disclosure case failed during `Page.captureScreenshot` with “Unable to capture screenshot”, after its overflow/focus assertions. The identical isolated case passed without code or assertion changes. No retry was added to the test configuration; the precise transient cause is not established.
- The wider serial database run passed 60/61. The Windows-CRLF hosted-upgrade case timed out in existing Facility seed 41 (`57014`, `ppo.shared_graph_guard()`), before Products seed 52. Its identical isolated rerun passed without code, assertion or timeout changes; the same isolated case passed on unchanged main `58679be`. The timeout was not reproduced and its precise cause remains unresolved; it is not claimed as a reproduced main defect. `regression-summary.json` preserves the distinct results.
- Final source inspection found the journal's single-query target rule rejected the new product-plus-revision pricing URL before sending a binding command. A bounded pricing-target rule preserves both IDs. A real browser command now proves response loss, reload recovery, exact target navigation and one binding per retained revision; unit checks also refuse unrelated extra queries and external targets.
- GitHub heads `f9c3fc6` and `57204c6` reach the shared browser setup failure: runners install Chrome 155.0.8059.39 while main's guard accepts 153/154. The [initial Products job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37536202200/job/112517641456) and [final application Products job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37539244359/job/112527893756) fail before their application tests; initial UI baseline and Engineering jobs show the same setup failure. Existing [PR #355](https://github.com/deanrfiedler-gif/powerplants-one/pull/355) owns that shared repair. Passing local Chrome 154 proof does not establish a green GitHub head. Foundation and design-register CI passed independently. `ci-initial-head.json` and `ci-application-head.json` retain their point-in-time observations; running checks are not passes.

## CI integration repair — 7 October 2026

Head `4033004c0c037aa54178ec8323ae29cc7f925687` completed with **43 successful and four failed checks**. Native Products, Engineering, both compiled browser lanes, the first database shard, hosted upgrade and the existing UI baselines passed. Leads and database shard 2 each failed the same three Leads/Projects cases because the exact seed list omitted 52. The CRM visual job failed on one absent Products design binding (shared incorrectly by all six routes), a seven-item rail expectation and a 27-item More expectation. The aggregate application gate failed because its database shard failed. [Full check list and diagnosis](ci-repair.json).

The repaired seed list includes 52 explicitly. Six workspace entries now bind their existing `products-native-*` records without changing proposed acceptance status. The all-permitted shell fixture requires eight ordered 25 px icons including Products, 28 More links and 29 destinations including Help; it checks the exact department-preserving Products URL. No assertion, timeout, retry policy or permission guard is weakened.

The unchanged-main comparison is source exact: `14102dc573e2b7604eb0275ee3b8a0ef429c2c0a` and main `fbf2ed39b0686a52d286aa55c6cfb8549672f569` share Git tree `b0e14cb31747a825766741970660b4925cbd0349`. Its Leads and database-shard checks pass; main's independent visual run passes all 39 cases with 30 retained skips. Main's reviewed migration 0072 is incorporated with combined counts for both 52 and 72, and an additional Products missing-52 upgrade case after 72.

Local repair proof passes 14 focused units and all 39 distinct visual cases across the 38/39 full run and unchanged isolated shell rerun. The shell case initially hit its unchanged 30-second deadline during concurrent local work, then passed in 18.2 seconds. The precise cause is unresolved; both attempts remain recorded. The design register passes after removing unsupported `tests/ui` catalogue dependencies; fixture references remain in the state/specification. All 14 targeted database/hosted-upgrade cases pass, including the three failed Leads cases, original checksum refusal, Field/policy preservation, all four Products installation orders, hosted original data, CRLF checksums and atomic rollback. Lint, TypeScript, foundation and naming checks pass. Fresh repair-head CI is recorded separately on the PR; running checks are not passes.

## Earlier implementation and scope

The preserved original `feat/products-catalogue-native` checkout at `cad98aca42cb233f142029d11601a78d7d4b521e` reported four units, six domain cases and a build, with its final HTTP/browser/upgrade/restart record unfinished. That observation is distinct from this completion run.

[Implementation contract](../../../contracts/products-catalogue.md), [completion decision](../../../decisions/ADR-0048-products-native-catalogue.md) and [handover](../../../delivery/products-native-handover.md) retain PD-01–05 boundaries. Catalogue changes preserve estimates and quotes; source refresh is deliberate. Unknown interfaces need owners, installed successors preserve original identity, uncertain commands recover original receipts, and absent stock observation remains Unknown. Pagination, product-to-estimate selection, production imports and live integrations remain later work.

## CI capacity follow-up — 7 October 2026

Head `af9e26b` passed 49 checks, including the earlier failed Leads and CRM visual checks and complete native Products proof. Database-1 exceeded its 90-minute job limit after 510 passes; its dependent aggregate failed. The [capacity repair and retained evidence](ci-capacity/README.md) incorporate main `c228c4f`, its three isolated database shards and Maintenance/Warranty, preserving both modules and the reviewed migration-72 gate. Combined capabilities, migration/seed/grant expectations and live design bindings are reconciled. Fresh final-head CI remains distinct from the retained cancelled source and earlier proof.

The integrated `d686723` checkpoint passed all 52 checks across 18 workflows. Measured headroom remained inadequate: database-2 finished in 89m42s and the primary browser job in 86m56s, both against 90-minute limits. The [capacity follow-up](ci-capacity/README.md#measured-headroom-follow-up) uses four native database shards and isolated desktop/mobile full-browser selection, preserving every test/deadline and the focused CRM/restart phases. Source code, migrations, tests and dependencies are unchanged from that green checkpoint. Fresh final-head CI remains separately required and is recorded on PR #358.
