# Service planner accepted design implementation evidence

<!-- versioning: git; committed history is authoritative -->

Scope: PL-01, route:/schedule; SVC-03, SVC-04 and SCM-08. Owner: Dean Fiedler. Builder: Codex. PR #808. Accepted source: [design decision](../../../decisions/service-planner-figma-design.md) and [icon-free captures](../../../reference/ui/service/service-planner-design-r01/README.md). Synthetic fixtures only.

## Main integration and validation — 5 November 2026

The existing build continues under the standing order. Merge-only commit `5ac509cb58c78fa3ef995db251fb4f7e9082515d` has parents `7029a5075c35239919d07bebbf8bc174541e5f48` and `2f2e399c27956b7cdfd411baeedae59d51a1d218`. The only conflict was `src/shell/module-workspaces.ts`: main's lines were retained and the PL-01 `/schedule` line inserted immediately before `/service/escalations`, in route order. Travel review's navigation and optional `Resource.user_id` / `exceptions[].reason` fields remain intact alongside `dispatch_readiness`.

Stable patch IDs changed from `7b6c56bb83ce957e587d1c3e79ce957e2ff6dd8d` to `97cb68422c927d1b4ddeb1320d930625f2535b1a` because of main's surrounding context. Comparing each file's added and removed lines found them identical. The JSON lists merged cleanly: guides are main's count 367 + 0; register is main's count 392 + 0. Only the two PL-01 entries in each list differ from the merge base. All unrelated main entry bytes are retained; there were no whitespace-only PR entry edits.

A later main advance merged #800 and #845. The second merge-only commit `ee5edd48da86e98fb3e3ed8dc1bd220322a840de` has parents `5ac509cb58c78fa3ef995db251fb4f7e9082515d` and `3faff7aef476904a30e878be8bdc9e95792fb4fb`. It merged without conflicts; both stable patch IDs were `97cb68422c927d1b4ddeb1320d930625f2535b1a`, with identical per-file additions/removals. Main's Excel import route and records remain intact. Guides remain main's count 367 + 0; register is now main's count 393 + 0. The serial database comparison retains its recorded clean-main baseline; dependency-sensitive checks are rerun after installing the new lockfile.

Main's cloud setup completed with Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 ready on the disposable loopback test database, and browser unavailable. The initial sandbox blocked the database connection with `connect EPERM 127.0.0.1:5432` and the compiled server with `listen EPERM 127.0.0.1:3000`; network-enabled retries succeeded. No timeout, expected value, viewport matrix or test isolation rule was weakened.

- Passed: foundation, prototype, naming, status source validation, 44 documentation unit tests, migration numbering, studio, and the full network-enabled `npm run check` (lint, TypeScript, all 1,405 unit tests and production build after the second main merge, parity fix and loading-state fix; the earlier full run passed 1,403 units).
- Passed: official planner database suite, 24/24 both before and after the parity fix, including the exact native dispatch-gate and revoked pack-access test. The prior reset/120-second deadline failures did not recur.
- The initial restricted unit run failed ten file-level tests with `test failed`: `azure-demo`, `browser-fixture-transport`, `fertigation-request-limit`, `foundation`, `guide-library`, `login`, `proof-database`, `proof-request-scope`, `quality-asset-observer` and `quality-packet-network` (all under `tests/unit/*.test.ts`). Each reproduced on clean main `2f2e399c27956b7cdfd411baeedae59d51a1d218`: **pre-existing on main in this environment**. The network-enabled full rerun passed every unit. The initial planner file-level `test failed` also reproduced on clean main; its network-enabled official run passed.
- The full 62-suite database selection completed: 747 tests, 396 passed, 351 failed, 0 cancelled and 0 skipped. The four selected compiled HTTP suites completed: 8 tests, 7 passed, 1 failed. Every remaining failure reproduced on clean main; the [validation manifest](validation-2026-11-05.json) records each test name, message, code, classification and main comparison, plus the fixed regression and passing rerun.
- Across database and HTTP results, 321 failures are **environment-blocked: browser** and 31 are **pre-existing on main in this environment**. The latter include the unchanged read-only-home fixture and assertions following unavailable output. Random temporary-directory suffixes differ between the two read-only-home runs; both exact messages are retained.
- Browser suites and four-width inspected application captures: **not run here; left to GitHub CI** (browser unavailable). Ready-head CI and the flow-limit check are recorded in the PR completion handoff; local results do not claim browser or visual acceptance.

The retained `quality-planner` parity test exposed a PR regression: summary `dispatch_readiness` had no corresponding detail value. The same test passed on clean main. A shared helper now applies the same native gate and pack-access predicates to both reads. Both unchanged quality-planner tests pass after the fix; the PL-01 test additionally checks detail parity and null evidence after pack-read revocation. No existing expected value changed.

Reference checks found all 115 paths in the changed guide/register/module records, component bindings and validation manifest present. The changed HTTP test does not reset the database; the PL-01 browser spec and its helper add no permission grants. The existing four-width coverage remains unchanged. Historical review fingerprints remain stale and preserved.

Ready-head CI at `13e830a6868ba7155ba8f22d9777d131e7edd2e6` exposed a retained loading-state regression in `tests/browser/quality-states.spec.ts:461`: SC-07 expected four unknown-count placeholders, but `.planner-stat-row strong` resolved to no elements. The [P11 diagnostic replay job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41968800300/job/127051978715) passed the selected Service-to-Finance journey and report-return journey, then reported this planner assertion. The planner now retains the four unknown-count placeholders while the current read is unavailable, with the settled PL-01 layout unchanged. Existing browser assertions, deadlines and viewport coverage remain unchanged. The same failing test was attempted on clean main, but browser launch failed with `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`: **environment-blocked: browser**. This does not classify the CI assertion as pre-existing; the implementation addresses the PR regression. Final-head browser verification is recorded in the PR handoff.

The [hold-lift comment](https://github.com/deanrfiedler-gif/powerplants-one/pull/808#issuecomment-6647521753) lifted the flagship hold on 5 November 2026. PL-01 remains a tier 1 flagship journey due for the stage 3b redraw under ADR-0067; its visual layer will be rebuilt after that redraw. Functional proof, visual acceptance, owner acceptance and deployment remain separate. The [dated completion fragment](../../../status/2026-11-05-service-planner-completion.md) records this boundary and the corrected agent attribution.

## Original development proof — 31 October 2026

Validation in progress. Focused planner/working-hours/workspace units: 24 passed. Chrome 156.0.8078.80 passes the runtime/PDF check. Real npm ci completed with Node 24.22.2 and npm 11.19.0, no engine override or junction. Dedicated local app port 3818; dedicated PostgreSQL test cluster port 5648. Typecheck, lint, studio:check, foundation, naming, prototype and status checks passed during development; final checks after subsequent refinements remain required.

The original focused database run exceeded the unchanged 120-second deadline. An unchanged-main test (`SV04 detail projects…`, base `1402c87b`) reproduced that timeout. A second run timed out in the retained read/access test, then failed in the new test’s reset hook with the native 3-second connection timeout. The supplemental run of the exact new hold assertions, after separate native migrate/seed and with permission grants restored in finally, passed in 4679 ms. That verifies the current gate values, bounded fields and revoked pack access; it does not turn the official database suite green.

The first browser run failed at sign-in while the database test reset the same fixtures. The server was stopped, native setup restored and later runs are serialized. The focused HTTP hold-contract case passed in 22.96 seconds. Scheduling/P-series browser proof and application visual comparison remain in progress. No unexecuted check is claimed as passing.

## Visual comparison and differences

The accepted Day, move dialog and phone sheet references were inspected before implementation. Application capture comparison at 1440×960, 1024, 390 and 320 is pending. No visual acceptance is claimed.

- On hold contains current filtered held visits. Native work orders have only Draft and Authorised states, so the design's typed held-order causes and release dates cannot be presented truthfully. Missing evidence stays reason unavailable. Source corrections appear on a fresh read; there is no invented timed automatic return.
- Gate reasons are verbatim and may be longer than the frames. One Review appointment link is the action, using existing source-owned controls. Suggestions are excluded.
- Existing policy preparation, reviewed versions, complete crew/travel and uncertain-save recovery remain in the forms, making them longer than the compact compositions. No rule or endpoint is added.
- Plan visit uses the existing proposal command, which does not assign or reserve crew. Suggested crew/free-time matching and the board preview from that design composition are not implemented; suggestions remain out of scope.
- Read provenance, the legend and the retained Proposed/cancelled list remain below the board. Existing Appointment state and alternate-timezone list support remain. Retained synthetic seeds differ in labels/counts from the design story; native fallback icons replace Pro artwork.
- Historical 9 October owner review is stale. Its date, reviewer and fingerprint are preserved; these changes grant no new review.

## Acceptance and deployment

Functional proof and visual inspection are separate from owner/device/screen-reader acceptance. Owner acceptance of this implementation is pending. Deployment not performed. Exact-head Claude review and all CONTRIBUTING merge gates remain required.
