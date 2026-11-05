# SV-08 review repair evidence — 4 November 2026

Merge commit: `90ae51afeca45e7f34b036c85ae0af1915a9b9fb`. Parents: `0f988ade8d06f27e8b78d47e7994c57374bbaa4a`, `750175f788b5bf82658ec256586a18e5fe6348ed`. The final fix head is recorded in the PR handover.

Cloud setup succeeded: PostgreSQL ready; browser unavailable. The commands use only the disposable `ppo_synthetic_test` database. Command-specific regression fixtures retain explicitly synthetic bytes; they do not claim renderer proof. Real rendering tests remain unchanged.

## Ten findings

| Finding | Fix and evidence | Regression proof |
|---|---|---|
| 1 Medium | `src/service/escalations/commands.ts:359`: require scoped `service.work_order.edit` and `activity.edit` before next-action replay. | `tests/database/service-escalations.test.ts:367`: refusal without Findings edit duty, including replay; no side effects. |
| 2 Medium | `src/service/escalations/commands.ts:112`: coordinator fallback requires case/native visibility, Service edit and Activity edit; retains owner and linked Activity audit. Decision and contract record this as an agent decision. | `tests/database/service-escalations.test.ts:405`: both reply and withdrawal after owner deactivation; unauthorised and non-coordinator actors refused; exact original owner and actor audit checked. |
| 3 Medium | `src/equipment/changes.ts:510`: refuse a cross-site Relocate/CorrectLocation while cases are nonterminal, with an explicit remedy. | `tests/database/service-escalations.test.ts:464`: both kinds refuse without changing Asset; withdrawal permits the move. |
| 4 Medium | `src/service/escalations/commands.ts:311`: support-route maintenance additionally requires `shared.edit` before Asset mutation/replay. | `tests/database/service-escalations.test.ts:521`: case duty without Equipment edit refuses, preserving Asset version, routes and side effects. |
| 5 Medium | `tests/database/intake.test.ts:1209` excludes new capability from unchanged snapshot and asserts it separately; `tests/database/policy-persistence.test.ts:188` preserves earlier counts and asserts exact seed-124 additions. | Both original failures reproduced before repair and passed on clean main. Full Intake 26/26 and Policy persistence 11/11 pass. Also corrected the AD-01 proof that stops at 0078 and added a separate upgrade-to-0124 proof; Access inspection passes 29/29. |
| 6 Low | `src/service/escalations/reads.ts:46`: one owner-candidate SQL query composed with native visibility predicates; cache its result across same-scope equipment options. Mutation still validates the selected owner. | Test exemption applies. The native identity and command regression fixtures exercise owner options/read DTOs. |
| 7 Low | `src/service/escalations/commands.ts:539`: reject sending before retained pack creation; do not rewrite the entered fact. | `tests/database/service-escalations.test.ts:554`: pre-pack sending refuses atomically; later sending succeeds. |
| 8 Low | `src/components/service-escalations.tsx:1084`: History uses existing `actionLabels`; explicit opening label. | `tests/browser/service-escalations.spec.ts:250`: History says “Record reply”. Authored and discovered; environment-blocked: browser. |
| 9 Low | `src/components/service-escalations.tsx:68`: retain register data during reload; accessible busy state at line 174. | `tests/browser/service-escalations.spec.ts:262`: delayed refresh retains the exact DOM row through busy and settled states. Authored and discovered; environment-blocked: browser. |
| 10 Low | `db/migrations/0124-service-escalation-cases.sql:60`: index `(workspace_id,updated_at DESC,id)` matches candidate filter/order. | `tests/database/service-escalations.test.ts:589`: EXPLAIN uses register index without Sort. |


## Migration and capability checklist

Migration and capability checklist:

- Integrated main `750175f78` has newest migration 0123; 0124 was free before the merge. This PR's 0124 migration and seed 124 follow 0123 in the registry, and seed 124 belongs to migration 0124. No 0124 reservation remains. `python3 scripts/check_migrations.py` passes: unique, registered and unreserved.
- Migration 0124 runs `SET CONSTRAINTS ppo.identity_target IMMEDIATE` before the business identity ALTERs and restores `DEFERRED` immediately after them (lines 3–20).
- AD-01 regenerated from LF capability-source bytes. Source SHA-256 `a314f27fc5f67a5ea6a144c8b9d51dd5b8908eb5f0212ddb8cf39dc8228b692c`; plain-English `service_escalation.record` label retained. Model/browser contracts and workspace copy pin 163 capabilities; model checks pass (107 groups). Browser catalogue execution is environment-blocked: browser.
- `escalationSeedGrants` in `tests/helpers/engineering-materials-grants.ts:253` is composed into all 26 files returned by `git grep -l 'SeedGrants(' tests/`. New grants are asserted separately; earlier bare counts remain earlier-seed counts. Seed 124 is expected over grants added by earlier seeds in the same upgrade, preserves existing users/grants, and adds no users.
- All 22 files returned by `git grep -l "NOT LIKE 'conversation.%'" tests/` exclude `service_escalation.%` beside the snapshot filter. Intake and Policy persistence now separate the new duties correctly; both full suites pass.
- Quality's reseed allowlist includes the new helper. FI-01 and FI-07 retain every earlier grant/user and exact new-grant and repeat-migrate/seed assertions. Those Field executions are blocked by their renderer-dependent setup; their assertions are not reported as passed.
- The AD-01 proof ending at 0078 expects no seed-124 grants; a separate 0077-to-0124 proof preserves every original row, checks exact additions, and checks repeated migration/seeding. Access inspection passes 29/29.
- The late reserved Maintenance 0051 proof starts with 0124 already installed, adds no case grant, preserves old rows/users/ledgers and proves repeated migrate/seed are inert. Its new non-rendering regression passes. Products retains all historical starts, includes 0124 as the newest start and proves no additions when seed 124 is already held. All 54 starting points pass, including repeated migrate/seed.
- The demo gate is 124, its added-migration count moves exactly 106 → 107, and the user count stays 22. Seed 124 grants existing users only.
- HTTP reset isolation includes `service-escalations.test.ts` in the exclusive set. Both affected browser fixtures use mocked transport and add no database permission grants.


## Other checks and controls

- `python3 scripts/check_foundation.py`, `check_prototype.py`, `check_naming.py`, `build_status.py --check` and `check_migrations.py`: passed. All documentation checks were rerun after the evidence/status additions and passed.
- `npm run check`: passed with the required network permission: ESLint, TypeScript, all **1,385 unit tests**, and the production Next build. The Access upgrade test and Nursery snapshot repair were added afterwards; their full database files pass 29/29 and 4/4. Targeted ESLint and full TypeScript validation both pass after those test-only changes.
- `npm run studio:check`: passed. Register 387 entries and guides 362; existing pending/stale visual reviews remain visible. This does not claim visual acceptance.
- `python3 scripts/build-access-review.py`: regenerated on LF source bytes; the generated output was already current. `node scripts/check-access-review-model.mjs`: 107 groups passed. The browser model check was attempted and could not launch: `Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome` — **environment-blocked: browser**.
- Playwright discovery for `tests/browser/service-escalations.spec.ts` and `tests/browser/service-findings.spec.ts` succeeded (41 tests including shared setup). Browser execution: **environment-blocked: browser — not run here; left to GitHub CI**. The new History and retained-register regressions are authored and discovered, not reported as passed.
- HTTP reset isolation was inspected in `scripts/http-suite.ts`. The browser fixtures add no database permission grants. No concurrently resetting suites were run.

The initial sandbox-only `npm run check` failed ten unit worker files with `test failed`: `azure-demo`, `browser-fixture-transport`, `fertigation-request-limit`, `foundation`, `guide-library`, `login`, `proof-database`, `proof-request-scope`, `quality-asset-observer`, and `quality-packet-network` (all under `tests/unit/`, suffix `.test.ts`). The exact files failed on clean main under the same restrictions: **pre-existing on main in this environment**. The subsequent full run with requested network access passed all 1,385 tests; no unit failure remains.

Field's `P07 capture late audit_events failure rolls back every database effect` initially hit the 120-second beforeEach limit (`failed running beforeEach hook`) during a long serial process. A fresh-process rerun completed setup and reached the real renderer (approximately 5.6 seconds total), then failed with `RenderOrStorageFailure`; the same test on clean main failed at the renderer in approximately 5.3 seconds. The initial hook timeout is retained here; the current test result is **environment-blocked: browser**, not a pass.

Field's `PT-06 complete procedure: queued renderer is not Issued, first crew response refuses actual start, second permits one real start` and `P07 PT-14 component preserves two task/asset outcomes and uncertain identity with owned remaining work` both failed with `Cannot read properties of undefined (reading 'assignment_id')`. Both exact tests failed with the same message on the clean `origin/main` checkout: **pre-existing on main in this environment**.

Finding 5's Intake and Policy persistence assertions failed on this branch before repair and passed on clean main. They now pass in their full files (26/26 and 11/11). Access inspection's historical 0078 assertion also failed only on this branch; that boundary was repaired without moving it, and a separate 0077-to-0124 exact-grant proof was added. Its full file passes 29/29.

Nursery assessment's `0117 preserves populated 0116 Nursery evidence, all grants/seeds and original ledger; replay is inert` failed only on this branch: its grant snapshot used `ORDER BY 1` (workspace, a non-unique key), so inserting seed-124 rows changed the order of unchanged grants. The exact test passed on clean main. The scoped repair uses grant ID ordering, retains the separate exact seed-124 assertion and adds complete grant equality after repeat migrate/seed. The full repaired file passes 4/4.

Two Output-action failures also reproduce exactly on clean main: `DK03-C01 shared issue delegates exact native operations; pack recovery retains original stored bytes` fails `assert.ok(original)`; `DK03-C08 stale source cannot issue through shared recovery` expects `StaleSource` but receives `Failed`. Both are **pre-existing on main in this environment**. The other ten Output-action cases are **environment-blocked: browser** with renderer errors.


Fourteen Pack failures reproduce with the same test names and messages on clean main, including missing original/stored output, `0 !== 1`, and `Failed` instead of `StaleSource`. They are **pre-existing on main in this environment**; the full per-test table records each exact message. The other twelve Pack failures are **environment-blocked: browser**. Eight Pack cases passed.


Planner passes all 23 cases and Products passes all 54 historical starting points. Each case ran in its own fresh process, serially, with unchanged assertions. Products includes the 0123 upgrade and the 0124 already-installed history; both pass exact preservation/addition checks and repeat migrate/seed checks.

Quotation release's `ES05 interrupted release rendering recovers the retained bundle without regenerating output` also reproduces on clean main: it expects `QuoteWorkerInterrupted` but receives `AppError` with “The exact draft output is unavailable. Its saved revision is retained for recovery.” It is **pre-existing on main in this environment**; the other fourteen release cases are **environment-blocked: browser**.


## Additional execution and totals

The required database/demo queue completed **77 files and 795 cases**: **397 passed**, **379 environment-blocked: browser**, and **19 pre-existing on main in this environment**. Every non-browser failure reproduced with the same test name and exact diagnostic on clean main. Failure-name counts match the TAP totals. All eight Access files pass (112 cases); the demo upgrade passes 7/7, including migration gate 124, 107 added migrations and the unchanged 22-user count.

Three additional Estimating upgrade proofs ran serially:

| Test | Result | Message |
|---|---|---|
| `E1-DB10 current-main upgrade and repeated seed preserve accepted CRM originals and revoked grants` (`tests/database/estimating.test.ts`) | Passed | Original rows, revoked grants and repeat seed preserved. |
| `E2 migration formalises exact E1 identities and preserves every accepted cost, quote, receipt and stored original` (`tests/database/estimating-workspaces.test.ts`) | environment-blocked: browser | `ExactDraftUnavailable`: The exact draft output is unavailable. Its saved revision is retained for recovery. |
| `DR01-DB03 migration 24 originals survive upgrade, deliberate concurrent adoption and exact quotation recovery` (`tests/database/estimating.test.ts`) | environment-blocked: browser | `ExactDraftUnavailable`: The exact draft output is unavailable. Its saved revision is retained for recovery. |

Only these three cases were selected from the two otherwise unchanged Estimating files. Other cases in those files were **not run here; left to GitHub CI**. The Products 0025 starting point separately passes with populated estimate history across 0026 and 0124.

The compiled application ran `tests/http/service-escalations.test.ts` after a successful synthetic database reset, without concurrent database suites:

- `SV08 HTTP authenticates every read, validates filters and commands and rejects origin/access bypass`: **passed**.
- `SV08 HTTP persists the complete lifecycle, exact replay, downloads, owned work and a follow-up loop`: **environment-blocked: browser** at `prepare_pack` (`tests/http/service-escalations.test.ts:145`). The HTTP response is `DependencyUnavailable`, “The request could not be completed. Try again using the recovery controls, or retain the support reference if the problem continues.” `src/service/escalations/commands.ts:454` invokes `renderEvidence`; its Chrome launch is at `src/service/escalations/evidence.ts:86`. The native tests of this same path fail explicitly with `browserType.launch: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`. This ties the HTTP failure to the setup summary's unavailable browser. The later lifecycle assertions were **not run here; left to GitHub CI**.

Every changed runnable test file was executed at least once, except the two browser specs explicitly blocked by the unavailable browser. The changed unit file is included in the 1,385-test unit run; all changed database/demo files are in the 77-file table; the HTTP file was executed above. Helpers were exercised by their consuming suites. Assertions after renderer-dependent setup failures remain **not run here; left to GitHub CI**. No check was treated as passing merely because it was blocked.


## Database execution

Serial `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-reporter=tap <file>`. No concurrent resets. Planner runs all 23 cases and Products runs all 54 historical starting points in separate serial processes; the table totals those invocations. The Field hook retry is described above and does not turn a renderer failure into a pass.

| File | Passed | Failed |
|---|---:|---:|
| `tests/database/service-escalations.test.ts` | 9 | 2 |
| `tests/database/intake.test.ts` | 26 | 0 |
| `tests/database/policy-persistence.test.ts` | 11 | 0 |
| `tests/database/maintenance-upgrade.test.ts` | 1 | 1 |
| `tests/database/field-timer-boundaries.test.ts` | 0 | 3 |
| `tests/database/field-customer-response.test.ts` | 0 | 9 |
| `tests/database/service-finding-next-action-upgrade.test.ts` | 9 | 0 |
| `tests/database/access-application.test.ts` | 15 | 0 |
| `tests/database/access-identity-register.test.ts` | 6 | 0 |
| `tests/database/access-inspection.test.ts` | 29 | 0 |
| `tests/database/access-local-teams.test.ts` | 17 | 0 |
| `tests/database/access-readiness.test.ts` | 4 | 0 |
| `tests/database/access-requests.test.ts` | 14 | 0 |
| `tests/database/access-review-attestations.test.ts` | 18 | 0 |
| `tests/database/access-withdrawal.test.ts` | 9 | 0 |
| `tests/database/assistant-upgrade.test.ts` | 10 | 0 |
| `tests/database/calls-migration.test.ts` | 2 | 0 |
| `tests/database/conversations-upgrade.test.ts` | 1 | 0 |
| `tests/database/cpq-packages-upgrade.test.ts` | 1 | 0 |
| `tests/database/cpq.test.ts` | 19 | 0 |
| `tests/database/customer-delivery-upgrade.test.ts` | 1 | 0 |
| `tests/database/discovery-creation.test.ts` | 8 | 0 |
| `tests/database/document-library.test.ts` | 14 | 2 |
| `tests/database/equipment.test.ts` | 10 | 0 |
| `tests/database/estimating-catalogue.test.ts` | 3 | 0 |
| `tests/database/excel-capacity-upgrade.test.ts` | 1 | 0 |
| `tests/database/excel-fx-upgrade.test.ts` | 1 | 0 |
| `tests/database/excel-import-upgrade.test.ts` | 2 | 0 |
| `tests/database/excel-landed-upgrade.test.ts` | 1 | 0 |
| `tests/database/excel-reimport-upgrade.test.ts` | 1 | 0 |
| `tests/database/excel-source-pricing-upgrade.test.ts` | 1 | 0 |
| `tests/database/field.test.ts` | 0 | 42 |
| `tests/database/finance-upgrade.test.ts` | 0 | 2 |
| `tests/database/inspection-attribution-upgrade.test.ts` | 0 | 1 |
| `tests/database/leads-amendments.test.ts` | 6 | 0 |
| `tests/database/leads-projects-integration.test.ts` | 4 | 0 |
| `tests/database/nursery-assessment.test.ts` | 4 | 0 |
| `tests/database/nursery-automation.test.ts` | 3 | 0 |
| `tests/database/offline.test.ts` | 0 | 22 |
| `tests/database/outcome-sources.test.ts` | 2 | 5 |
| `tests/database/output-actions.test.ts` | 0 | 12 |
| `tests/database/packs.test.ts` | 8 | 26 |
| `tests/database/planner.test.ts` | 23 | 0 |
| `tests/database/products-upgrade.test.ts` | 54 | 0 |
| `tests/database/project-baselines.test.ts` | 5 | 0 |
| `tests/database/project-commercial-upgrade.test.ts` | 2 | 0 |
| `tests/database/project-programme.test.ts` | 8 | 0 |
| `tests/database/project-raid.test.ts` | 7 | 0 |
| `tests/database/project-specialist-handover-upgrade.test.ts` | 0 | 2 |
| `tests/database/project-specialist-upgrade.test.ts` | 1 | 1 |
| `tests/database/project-specialist-work-upgrade.test.ts` | 0 | 1 |
| `tests/database/quality-upgrade.test.ts` | 0 | 3 |
| `tests/database/quotation-allocation-shortfall.test.ts` | 0 | 11 |
| `tests/database/quotation-conversion.test.ts` | 0 | 11 |
| `tests/database/quotation-disposition.test.ts` | 0 | 13 |
| `tests/database/quotation-material-resolution.test.ts` | 2 | 10 |
| `tests/database/quotation-receipt-correction.test.ts` | 0 | 9 |
| `tests/database/quotation-release.test.ts` | 0 | 15 |
| `tests/database/quotation-reservation-reconciliation.test.ts` | 0 | 6 |
| `tests/database/quotation-response.test.ts` | 0 | 10 |
| `tests/database/quotation-supply-followup.test.ts` | 0 | 16 |
| `tests/database/quotation-task-branch.test.ts` | 0 | 31 |
| `tests/database/quotation-task-chain.test.ts` | 0 | 16 |
| `tests/database/quotation-task-dependency.test.ts` | 0 | 7 |
| `tests/database/quotation-task-diamond.test.ts` | 0 | 22 |
| `tests/database/quotation-task-merge.test.ts` | 0 | 38 |
| `tests/database/reports.test.ts` | 0 | 43 |
| `tests/database/sales-delivery-binding.test.ts` | 8 | 0 |
| `tests/database/sales-estimating-binding.test.ts` | 6 | 0 |
| `tests/database/service-escalation-inspection.test.ts` | 0 | 1 |
| `tests/database/site-readiness-upgrade.test.ts` | 0 | 3 |
| `tests/database/site-surveys-upgrade.test.ts` | 1 | 0 |
| `tests/database/template-drafts-upgrade.test.ts` | 1 | 0 |
| `tests/database/template-publication-upgrade.test.ts` | 1 | 0 |
| `tests/database/template-renderer-upgrade.test.ts` | 0 | 1 |
| `tests/database/template-use-upgrade.test.ts` | 0 | 1 |
| `tests/demo/upgrade.test.ts` | 7 | 0 |

## Failure disposition

| File | Test | Disposition | Message |
|---|---|---|---|
| `tests/database/service-escalations.test.ts` | SV08 retained HTML/PDF hashes, explicit exclusions and changed evidence invalidate review | environment-blocked: browser | browserType.launch: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome Run "npx playwright install chrome" ('ERR_TEST_FAILURE') |
| `tests/database/service-escalations.test.ts` | SV08 sent fact creates one owned chase, reply retires it, and advice becomes native owned work without closing source | environment-blocked: browser | browserType.launch: Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome Run "npx playwright install chrome" ('ERR_TEST_FAILURE') |
| `tests/database/maintenance-upgrade.test.ts` | late reserved Maintenance migration preserves the current schema, originals, outputs and exact grants | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/field-timer-boundaries.test.ts` | FI01 one personal timer spans appointments, preserves denied originals and checks receipt authority | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-timer-boundaries.test.ts` | FI01 zero-second transitions, real Undo expiry and report freeze keep distinct authority | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-timer-boundaries.test.ts` | FI01 additive 0049 upgrade retains existing time, arrivals, receipts and revoked grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-01 every attendance acknowledgement remains distinct from report response, internal acceptance and Finance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-02 two responders, one explicit successor, reused owned work and independent similar responses | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-03 changed recipient, source, service owner and permissions refuse fresh capture and retain originals | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-04 newly arriving incident hold permits factual response but preserves hold and redaction | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-05 failed inspection stays outstanding after internal review and customer acceptance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-06 old queue hash, new subject replay, immutable corrections and rejected reassociation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-08 missing original evidence, revoked evidence access and wrong presentation bytes never save a response | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-09 queued attendance acknowledgements revalidate audience and current authority without rewriting originals | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field-customer-response.test.ts` | FI07-07 populated 0056 upgrade preserves original response hashes, output bytes, grants and exact ledgers | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/document-library.test.ts` | DK-B07 existing Job Pack issue bytes and native authority are reused; no library grant bypasses source scope | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/document-library.test.ts` | DK-B08 existing Service Report issue exact PDF is linked without rendering a replacement | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 upgrade from P06 and repeat seed retain exact original issue, source, receipts and revoked grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | PT-06 complete procedure: queued renderer is not Issued, first crew response refuses actual start, second permits one real start | pre-existing on main in this environment | "Cannot read properties of undefined (reading 'assignment_id')" ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 concurrent identical starts replay once; changed operation conflicts; another crew member records only their own start | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 distinct simultaneous personal starts admit one and reject the stale competitor | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 actual start races ordinary cancellation without losing either original evidence or the started-work boundary | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start racing move preserves original source and returns a controlled outcome | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start racing reassign preserves original source and returns a controlled outcome | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start racing scope preserves original source and returns a controlled outcome | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start racing withdraw preserves original source and returns a controlled outcome | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 future-effective crew can be booked and acknowledge but cannot confer current actual-start authority | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged expected_version cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged schedule_version cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged assignment_version cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged scope_version cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged issue_hash cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged issue_id cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged assignment_id cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 stale or forged scope_revision_id cannot start attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 current capability, assignment, same-404 and receipt/file boundaries survive revoked permission | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 typed evidence preserves attribution, failed fixes and exact decimals; duplicate capture and changed reuse are controlled | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 actor-wide time conflict prevents concurrent overlapping labour but allows adjacent intervals | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 correction creates an immutable successor, requires own current source version and retains all original authority | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 exact correction moves the active time projection and retains the original interval | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 rejects unknown fields, forged actor, wrong task/asset, invalid time/material/reading/checklist and missing traceability | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 withdrawal after start holds further work, permits original-context evidence requiring review and preserves P05 move/cancel refusal | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 durable photo initiation is not availability; unchanged upload/finalise retry retain original identity, bytes and hash | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 storage success/database failure recovers the original upload without duplicate bytes or a false Available reference | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 wrong hash/interrupted bytes remain Pending; unsupported exact bytes are Rejected; missing uploaded bytes become Quarantined | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 Partial draft saves exact evidence and owned remaining work without order/report/Finance closure | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 UnableToProceed draft saves exact evidence and owned remaining work without order/report/Finance closure | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 Complete draft requires every task/check and Available attachment; saved draft is not attendance/report approval | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 completion references are exact; corrections mark prior draft stale and required unavailable attachments block Complete | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start late audit_events failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start late operation_receipts failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 start late outbox_jobs failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 capture late audit_events failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 capture late operation_receipts failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 capture late outbox_jobs failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 draft late audit_events failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 draft late operation_receipts failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 draft late outbox_jobs failure rolls back every database effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/field.test.ts` | P07 PT-14 component preserves two task/asset outcomes and uncertain identity with owned remaining work | pre-existing on main in this environment | "Cannot read properties of undefined (reading 'assignment_id')" ('ERR_TEST_FAILURE') |
| `tests/database/finance-upgrade.test.ts` | P10 additive upgrade from real P09 issued originals retains exact rows, bytes, migration checksums and repeat seeds | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/finance-upgrade.test.ts` | P10 arrival after already-applied E1 0012 retains exact estimating originals, output, receipts and revoked grants | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/inspection-attribution-upgrade.test.ts` | 0115 preserves populated legacy attempts, instrument snapshots, hashes and ledger without inferred attribution | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 additive P07 upgrade preserves attendance, receipt, bytes and revoked grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 provisional start resolves an immutable causal reference and isolates a failed sibling | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 100 original captures replay exact receipts once and changed reuse conflicts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 exact PNG causal chain and interrupted finalisation recover one immutable file and completion draft | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 unknown fields, wrong actor/workspace/site/appointment and unsupported payload isolate failures | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 missing and cyclic dependencies preserve siblings without accepting children | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 normal acceptance and restricted recovery are exclusive under competing original-operation locks | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 revoked permission blocks accepted normal receipt recovery and preserves local-only identity | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 revoked ordinary access requires the exact prior recovery capability and an owned immutable disposition | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 recovery retains exact private PNG and denies inactive identity or other owner byte access | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 cancelled-before-start intent never creates attendance; stale factual evidence has restricted recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 withdrawn pack preserves started factual capture as review-required authority, without reopening work | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 actor-wide time overlap and immutable successor evidence remain enforced through sync | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 late audit_events failure rolls back capture and all accepted facts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 late operation_receipts failure rolls back capture and all accepted facts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 late outbox_jobs failure rolls back capture and all accepted facts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 late sync_acceptances failure rolls back capture and all accepted facts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 queued reassign refuses stale start and preserves exact original evidence in owned recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 queued amend refuses stale start and preserves exact original evidence in owned recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 queued scope refuses stale start and preserves exact original evidence in owned recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 restricted PNG storage-success/database-failure keeps original hash and recovers one case and Activity | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/offline.test.ts` | P08 expired prior recovery capability cannot preserve or disclose original evidence | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/outcome-sources.test.ts` | LC-15 exact quotation-based Won retains one outcome and original recovery after a native response correction | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/outcome-sources.test.ts` | LC-15 stale reviewed response, wrong Deal and mismatched outcome refuse every effect | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/outcome-sources.test.ts` | LC-15 current quote permission governs stored source identities and original outcome recovery | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/outcome-sources.test.ts` | LC-15 a quotation successor invalidates a reviewed new outcome without changing the original issued evidence | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/outcome-sources.test.ts` | LC-15 late publication failure rolls back outcome, handover, source, receipt and audit together | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/output-actions.test.ts` | DK03-C10 native InProgress applicability permits exact distribution and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C11 a Confirmed preparation survives native start without changing its exact issue | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C12 native schedule and crew changes refuse new distribution without changing original attempts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C01 shared issue delegates exact native operations; pack recovery retains original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(original)  ('ERR_ASSERTION') |
| `tests/database/output-actions.test.ts` | DK03-C02 report issue uses exact review/template and resumes original finalisation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C03 per-recipient original replay, concurrent claims, unknown outcome and additive reconciliation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C04 current permissions, exact recipient binding and withdrawn historical reconciliation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C05 report recipient exactness, storage refusal and original operation recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C06 database guards and receipt failure roll back all distribution effects | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C07 populated 0090 upgrade retains all originals and adds only empty distribution storage | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/output-actions.test.ts` | DK03-C08 stale source cannot issue through shared recovery | pre-existing on main in this environment | Expected values to be strictly equal: + actual - expected  + 'Failed' - 'StaleSource'  ('ERR_ASSERTION') |
| `tests/database/output-actions.test.ts` | DK03-C09 loss of recipient access during storage refuses distribution; withdrawn preparations cannot simulate sending | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | SC-06 issue and acknowledgement advance the appointment record without reporting a source change | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 exact immutable output and two independent acknowledgements control component readiness | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 competing workers and competing issue requests cannot duplicate file/issue/tasks | pre-existing on main in this environment | Expected values to be strictly equal:  0 !== 1  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 same recipient concurrency is one response and cannot acknowledge for another crew member | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 return retains comments; amendment freezes predecessor; old issue cannot satisfy successor | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 withdrawal preserves exact original issue and individual response history | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 source changed during render prevents issue and retains prior generated bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(await documentStore().locate({ ...q.p, operation_id: job.id }))  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 template changed during render prevents issue and retains prior generated bytes | pre-existing on main in this environment | Expected values to be strictly equal: + actual - expected  + 'Failed' - 'StaleSource'  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 assignment changed during render prevents issue and retains prior generated bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(await documentStore().locate({ ...q.p, operation_id: job.id }))  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 permission changed during render prevents issue and retains prior generated bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(await documentStore().locate({ ...q.p, operation_id: job.id }))  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 afterStore failure recovers exact original output without rendering or duplicate effects | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(first)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 beforeFinalise failure recovers exact original output without rendering or duplicate effects | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(first)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 render failure remains owned and recoverable with no file or issued claim | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok("issue_id" in (await processRenderJob(job.id)))  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 missing historical source is never replaced by latest; existing issue remains retrievable | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 P05 cancellation atomically withdraws real issue and keeps original output/history | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 P05 confirmed move invalidates real pack/assignment applicability and preserves issued bytes | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 late pack_issues database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 late pack_recipients database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 late pack_distribution_events database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 late audit_events database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 late operation_receipts database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 late outbox_jobs database failure rolls back issue and recovers original stored bytes | pre-existing on main in this environment | The expression evaluated to a falsy value:  assert.ok(stored)  ('ERR_ASSERTION') |
| `tests/database/packs.test.ts` | P06 acknowledgement audit failure rolls back response/hold and unchanged retry succeeds | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 current recipient access is non-waivable and published competency remains immutable | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 amendment contact activity failure rolls back withdrawal and exact retry creates one owned task | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/packs.test.ts` | P06 successor scope Draft atomically invalidates real pack without altering authorised scope or original files | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/project-specialist-handover-upgrade.test.ts` | PJ06-R2 upgrade from populated 103 preserves every legacy payload, template publication, hash, grant, receipt and ledger exactly; repeat run adds nothing | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/project-specialist-handover-upgrade.test.ts` | PJ06-R2 upgrade from populated 104 preserves every legacy payload, template publication, hash, grant, receipt and ledger exactly; repeat run adds nothing | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/project-specialist-upgrade.test.ts` | PJ06-UPGRADE populated 102 upgrade retains original identities, financial source and operation ledgers | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/project-specialist-work-upgrade.test.ts` | PJ06-R3 populated 0105 upgrade preserves exact R1/R2 evidence, grants, sources, identities and receipts; repeat adds nothing | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quality-upgrade.test.ts` | P11 additive upgrade preserves actual current-main/P10 Approved records, original outputs and revoked receipt grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/quality-upgrade.test.ts` | P11 additive upgrade preserves actual current-main/P10 OutcomeUnknown records, original outputs and revoked receipt grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/quality-upgrade.test.ts` | P11 additive upgrade preserves actual current-main/P10 Reconciled records, original outputs and revoked receipt grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall independently receives exact atomic reductions, preserves identities and returns honest unmet Demand | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall supports a single other-owner allocation reduction without versioning unchanged Demand | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall retains quotation resolution, permits continuing referral, and keeps receiving corrections and reassignment lineage | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 atomic shortfall late refusal rolls back every allocation history impact and receipt; original retry remains exact | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 allocation receiving is independently owned, site scoped, revocable and never delegated by Supply ownership | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall refuses incomplete or increasing proposals and selectively holds changed dependencies while preserving originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall enforces actual picked lower bounds, retains Pick evidence and never clears owned impacts | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 shortfall new other-source allocation and changed owner hold the exact received proposal and retain predecessor lineage | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 allocation received review is held by corrected quotation response and successor issue with original effects preserved | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 Receipt successor holds received allocation work while preserving accurate evidence and its original correction receipt | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-allocation-shortfall.test.ts` | ES07 populated 0065 upgrade preserves ES04–07 corrections histories grants allocations exact outputs and original operations | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 exact receiving and reviewed real demand conversion retain commercial evidence, native receipts and immutable originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 multiple product quantities survive unrelated saved-estimate changes without invalidating the issued offer | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 successor issue holds unexecuted plan and concurrent receiving edits cannot silently replace it | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 owned returns and corrections preserve originals; missing ambiguous obsolete and incompatible mappings hold review | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 changed response holds frozen plan and retains exact original recovery | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 mapping changes hold only their reviewed basis; immutable replacement plans retain prior decisions | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 competing execution and duplicate originals produce exactly one native target | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 revoked receiving and source duties deny reads, native targets and original receipts | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 injected late failure rolls back native targets identities revisions and all receipts | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 selective target-basis hold and durable guards refuse forged receiving or target scope | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-conversion.test.ts` | ES07 populated 0060 upgrade preserves every review release response grant identity receipt history and original output | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 disposition review alone stays open; explicit retention resolves only exact exception and preserves conversion | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 quantity disposition mutates native Forecast with exact version, original lineage, impact activity and native receipt | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 applicability is selective across sibling mappings, targets and unrelated saved estimates | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 changed response and superseded issue hold reviewed actions without losing completed targets | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 target edits stale only their review; immutable Hold and replacement decisions preserve earlier effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 Approved demand and consequential evidence hold quantity changes; retention remains explicit and non-operative | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 concurrent decisions and applications prevent duplicate or conflicting native effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 permission revocation protects review, target history, commands and exact original recovery | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 late disposition failure rolls back native quantity, history, impact, activity, audit and receipts | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 retains all six decimal places at the native quantity limit and durable guards refuse forged decision scope | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 downstream allocation/source changes hold retained reviews and revoked dependency access prevents frozen disclosure | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 unavailable owner holds pending disposition and native receipt recovery rechecks current authority | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-disposition.test.ts` | ES07 populated 0061 upgrade preserves complete commercial/conversion/native evidence, grants, identities and original bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: four separate acceptances apply exact Project forecast withdrawal and retain unmet Demand, Activities and original bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: corrected Returned/Held receiving invalidates frozen review and preserves predecessor decisions | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: late refusal rolls back both native effects, histories and receipts; absent lookup permits only unchanged original retry | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: unrelated Supply preserves applicability; a new native task dependency holds exact unexecuted work | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: Activity completion and review notes cannot clear operational Impact or restore readiness | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: quotation retention leaves owned work actionable and returned native evidence requires fresh explicit disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: explicit referral return enables reassignment and new receiving while original decisions remain recoverable | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: a task owner receives without Supply write authority; revoked or changed source authority holds execution and disclosure | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: another accepted allocation target cannot compete for the same Project task | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-material-resolution.test.ts` | ES07 material: populated 0066 upgrade preserves every prior table, grant, receipt and issued byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt correction requires every receiving decision, commits native predecessor/successor and honest shared shortfall, and recovers exact originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt immutable return, hold, receiving corrections and proposal replacements require fresh exact decisions | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt refuses invalid arithmetic and absent predecessor, invalidates only relevant unexecuted decisions | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt independently owned demands require their own decisions, current permissions and reassignment lineage | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt late failure preserves facts allocations impacts and receipts atomically; missing lookup is inconclusive | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt populated 0064 upgrade preserves prior generations grants histories allocations outputs and original operations | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt partial unresolved correction retains separate Stock observation; unknown original Supply outcome holds replacement | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt new shared Demand invalidates receiving and competing referrals preserve immutable item identity | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-receipt-correction.test.ts` | ES07 Receipt corrected response and successor issue invalidate pending received review without changing originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 exact preparation, independent approval, exact issue and simulated distribution preserve original Draft bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 stale observed recipient refuses preparation; changed saved estimate holds approved issue without editing evidence | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 unknown simulation holds a new attempt and retains attributable exact-attempt resolution | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 independent duties and current permission refusal cover commands and original receipt recovery | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 concurrent independent approvals and late issue failure leave exactly one complete operation | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 broad duty grants cannot permit owner approval or approver issue | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 interrupted release rendering recovers the retained bundle without regenerating output | pre-existing on main in this environment | The error is expected to be an instance of "QuoteWorkerInterrupted". Received "AppError"  Error message:  The exact draft output is unavailable. Its saved revision is retained for recovery. ('ERR_ASSERTION') |
| `tests/database/quotation-release.test.ts` | ES05 explicit issue successor does not inherit approval and preserves both exact issued originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 captured recipient authority is required even after a permitted contact replaces the opportunity contact | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | ES05 populated migration 58 upgrade preserves reviewed estimates, receipts, output and exact prior grants | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | quotation register follows native draft, return, approval, issue and distribution with one current row | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | quotation register retains native response holds and issued history when source or current revision changes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | quotation register separates exact conversion from newer drafts and redacts inaccessible conversion evidence | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | quotation register uses bounded stable windows, literal search, scoped counts and exact quotation identities | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-release.test.ts` | quotation register finds an older quotation beyond the first hundred estimate rows and flags stale unissued basis | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency executes exact native successor, conserves shared quantities, recovers originals and requires fresh disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency records evidenced Failed on Forecast demand without changing quantity or needing an allocation | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency refuses unsupported facts, unaccepted work and partial/invented payloads; retains owned holds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency selectively holds changed native and quotation evidence and preserves corrected reviews | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency current authority precedes effects, original receipts and restricted shared history | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-reservation-reconciliation.test.ts` | ES07 dependency populated 0063 upgrade preserves all rows, accepted reviews, receipts, grants, histories and output bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 exact acceptance, owned preparation, immutable correction, receipt recovery and original Draft/issued bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 information clarification requires exact answer and attributable confirmation; conditional acceptance holds preparation | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 material negotiation cannot be silently cleared and explicit ES05 successor inherits no response | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 unrelated source change and unissued preparation retain offer applicability; actual successor holds original preparation | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 same original concurrency converges; different submissions conflict; wrong issue and time are refused | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 current role, company, original recipient and receipt authority are enforced | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 deferred atomic evidence guard rolls back a command after late failure | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 missing output holds a new response but cannot erase or prevent authorised original receipt recovery | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 direct insert needs exact issue/hash and deferred atomic evidence | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-response.test.ts` | ES06 populated 0059 upgrade preserves release/review, receipts, grants, identities and exact Draft/issue bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply exact owned referral, original replay, receiving return/hold and explicit replacement | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply real exact allocation mutation preserves shared demand and returns native receipt; explicit new ES07 disposition required | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply exact zero retains allocation identity; native Approved state remains held for demand quantity disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply retention and continuing hold are explicit applied outcomes; review and Activity alone do not resolve ES07 | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply selective applicability: unrelated records survive; shared-supply edits and corrected receiving hold pending effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply conservation rejects excessive exact proposals and consequential dependencies hold adjustment but retain useful review | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply duplicate and competing commands have one exact effect; changed-payload retry fails | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply current permissions protect referral, worklist, snapshots, original receipt and native replay | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply Forecast without held dependencies cannot manufacture a referral; unknown reads and mismatched lineage are refused | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply explicit reassignment preserves acknowledgements and rejects the previous owner's new actions | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply late transaction failure rolls back actual allocation, revisions, activities, histories and receipts | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply SQL evidence guards refuse forged commands, assignment, stale acceptance and receipt-free history | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply populated 0062 upgrade preserves all earlier commercial evidence, disposition, allocations, grants, identities and original bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply pending actions follow exact corrected mapping and response | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply successor issue holds pending review while original owned follow-up remains usable | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-supply-followup.test.ts` | ES07 Supply new shared-demand dependency holds pending adjustment and restricted linked evidence cannot leak | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | FS/FS branch requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | FS/SS branch requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | SS/FS branch requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | SS/SS branch requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | late SecondTask refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | late ThirdTask refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | late Impact refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | late Outcome refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | third task owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | quotation retention remains resolved through branch review; native result requires fresh explicit ES07 disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | third task cannot be claimed by another accepted target; returned referral permits explicit reassignment without losing originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | populated 0069 upgrade preserves isolated-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | populated 0069 upgrade preserves two-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | populated 0069 upgrade preserves linear-chain originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | Three-task branch accepts the native direction; reversed and newly added dependencies hold unexecuted receiving | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | two-task receiving never authorises a branch | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | linear-chain receiving never authorises a branch | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | new consequential Project Engineering after review holds the complete branch without partial task effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | ES07 branch: Activity completion and review notes cannot clear operational Impact or restore readiness | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new incoming edge at branch task A holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new incoming edge at branch task B holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new incoming edge at branch task C holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new outgoing edge at branch task A holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new outgoing edge at branch task B holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | a new outgoing edge at branch task C holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses B to C introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses C to B introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses merge introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses reversed A-B introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses missing A-B introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-branch.test.ts` | branch review refuses missing A-C introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | FS/FS chain requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | FS/SS chain requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | SS/FS chain requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | SS/SS chain requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | late ThirdTask refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | late Impact refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | late Outcome refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | third task owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | quotation retention remains resolved through chain review; native result requires fresh explicit ES07 disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | third task cannot be claimed by another accepted target; returned referral permits explicit reassignment without losing originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | populated 0068 upgrade preserves isolated-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | populated 0068 upgrade preserves two-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | Three-task chain accepts the native direction; reversed and newly added dependencies hold unexecuted receiving | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | two-task receiving never authorises newly selected third-task consequences | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | new consequential Project Engineering after review holds the complete chain without partial task effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-chain.test.ts` | ES07 chain: Activity completion and review notes cannot clear operational Impact or restore readiness | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | FS pair requires five exact decisions and atomically preserves dependency with two native task saves and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | late refusal rolls back both task saves, dependency rows, histories and Impact; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | successor owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | quotation retention remains resolved through paired review; native result requires fresh explicit ES07 disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | paired successor cannot be claimed by another accepted target; returned referral permits explicit reassignment without losing originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | populated 0067 upgrade preserves isolated resolution, receiving, allocations, grants, original receipts and issued bytes | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-dependency.test.ts` | SS pair accepts the native direction; reversed and newly added dependencies hold unexecuted receiving | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/FS/FS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/FS/FS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/SS/FS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/SS/FS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/FS/SS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/FS/SS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/SS/SS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/SS/SS/FS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/FS/FS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/FS/FS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/SS/FS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/SS/FS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/FS/SS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/FS/SS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | FS/SS/SS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | SS/SS/SS/SS diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | populated 0071 upgrade preserves isolated-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | populated 0071 upgrade preserves two-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | populated 0071 upgrade preserves linear-chain originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | populated 0071 upgrade preserves branch originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | populated 0071 upgrade preserves merge originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-diamond.test.ts` | restricted runtime prepared diamond reads expose all four tasks only with current authority and no ledger privilege | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | FS/FS merge requires six exact decisions and atomically preserves both dependencies with two native task saves and retained B and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | FS/SS merge requires six exact decisions and atomically preserves both dependencies with two native task saves and retained B and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | SS/FS merge requires six exact decisions and atomically preserves both dependencies with two native task saves and retained B and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | SS/SS merge requires six exact decisions and atomically preserves both dependencies with two native task saves and retained B and one Impact successor | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | late FirstTask refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | late SecondTask refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | late Impact refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | late Outcome refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | third task owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | quotation retention remains resolved through merge review; native result requires fresh explicit ES07 disposition | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | third task cannot be claimed by another accepted target; returned referral permits explicit reassignment without losing originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | Three-task merge accepts the native direction; reversed and newly added dependencies hold unexecuted receiving | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | new consequential Project Engineering after review holds the complete merge without partial task effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | ES07 merge: Activity completion and review notes cannot clear operational Impact or restore readiness | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new incoming edge at merge task A holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new incoming edge at merge task B holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new incoming edge at merge task C holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new outgoing edge at merge task A holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new outgoing edge at merge task B holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | a new outgoing edge at merge task C holds frozen review and is explicitly identified by fresh graph inspection | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses A to B introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses B to A introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses branch introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses reversed A-C introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses missing A-C introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | merge review refuses missing B-C introduced by native dependency saves | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | populated 0070 upgrade preserves isolated-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | populated 0070 upgrade preserves two-task originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | populated 0070 upgrade preserves linear-chain originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | populated 0070 upgrade preserves branch originals, every old row and output byte | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | B's native position invalidates review even though the action never edits B; unrelated Project changes do not | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | isolated consent cannot authorise merge receiving or native effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | pair consent cannot authorise merge receiving or native effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | chain consent cannot authorise merge receiving or native effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | branch consent cannot authorise merge receiving or native effects | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | retained B owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | B validity comes from native dates and warnings, never its label or receiving note | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/quotation-task-merge.test.ts` | restricted runtime prepared merge reads expose current retained B only with current authority and no ledger privilege | environment-blocked: browser | 'The exact draft output is unavailable. Its saved revision is retained for recovery.' ('ExactDraftUnavailable') |
| `tests/database/reports.test.ts` | P09 fresh and P08 upgrade preserve originals and repeat seed does not revive revoked report grants | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 exact submission freezes entries; duplicate original recovers same receipt; changed reuse conflicts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | SV-06 register projects permitted exact attendance facts and recorded return counts | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 return comments, linked correction, successor submission and narrow attendance acceptance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 competing approve and return decide exactly one set and late retry recovers original | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 strict review fields, exact set/version and server owner permissions | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 required bytes missing after submission block review without changing original | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 all five exact responses, mandatory remarks, immutable synthetic marks and original receipt recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issued bytes and every customer projection exclude private fields and filenames | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 storage success then database failure reconciles original bundle and one issue | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 template change during real generation retains stale owned output and no issue | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 revoked review and response receipt capability returns no original receipt | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 accepted attendance correction preserves old output and refuses prior response reassociation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 submit late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 submit late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 submit late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 review late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 review late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 review late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 return late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 return late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 return late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 amend late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 amend late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 amend late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issue late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issue late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issue late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 response late audit_events rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 response late operation_receipts rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 response late outbox_jobs rollback preserves business facts and original recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 exact render input, response nullable checks and accepted end are physically protected | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 source snapshot canonical hash uses persisted timestamps and every exact accepted original | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 competing personal submissions and identical customer responses produce one original effect | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 real source change during generation and corrupted original bundle cannot issue | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issued original byte removal or wrong hash is unavailable rather than regenerated | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 unsupported signature bytes are rejected without response or follow-up | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 returned Complete and accepted report-only correction retain passed controls and original attendance | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 all actually started crew must be accepted independently, with no invented attendance or declarations | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 competing report correction and issue request respect one exact report version | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 issue authority revoked after durable storage refuses release and original issue receipt recovery | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 partial attendance review retains incomplete declarations without inventing missing quantities or Finance readiness | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/reports.test.ts` | P09 actual template source changes after rendering retain the original attempt without release | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/service-escalation-inspection.test.ts` | SV08 senior technician captures native submitted readings, instrument attribution and immutable configuration without contact or commercial fields | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/site-readiness-upgrade.test.ts` | 0120 from 117 preserves populated contacts, original operations, policy pins and issued bytes; seed replay is inert | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/site-readiness-upgrade.test.ts` | 0120 from 118 preserves populated contacts, original operations, policy pins and issued bytes; seed replay is inert | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/site-readiness-upgrade.test.ts` | 0120 from 119 preserves populated contacts, original operations, policy pins and issued bytes; seed replay is inert | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_TEST_FAILURE') |
| `tests/database/template-renderer-upgrade.test.ts` | Populated 0102 upgrade retains an assigned DK06-OUT09-1 publication and queued pack unchanged; its successor publishes as DK06-OUT09-2 | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_ASSERTION') |
| `tests/database/template-use-upgrade.test.ts` | R4 populated 0093 upgrade preserves publications, exact ledgers and queued legacy output; future use retains the pinned baseline until activation | environment-blocked: browser | '{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}' ('ERR_ASSERTION') |

## Merge contribution accounting

Merge base selected: `c69a0922c19e2d62b5859c57895204f5c44684c3`; multiple merge bases exist (the other is `464f73dd088d8455959d6cd1ca79ae480455af0a`). Merge `90ae51afeca45e7f34b036c85ae0af1915a9b9fb`.

Class counts: unchanged 58; (a) 68; (b) 69; (c) 2; (d) 1; (e) 2; (f) 1. Counts overlap for document-library.

Classes: (a) already on main through #801 or other merged PRs; (b) authorised version/ledger/count/atVersion changes; (c) registry ordering or demo gate/comment; (d) Findings browser re-application; (e) entry-level JSON merge; (f) surrounding context only. “Unchanged” means the added/removed lines are identical. The table accounts for all 200 files in OLD or NEW.

OLD compares the selected merge base to `0f988ade8d06f27e8b78d47e7994c57374bbaa4a`; NEW compares main `750175f788b5bf82658ec256586a18e5fe6348ed` to the merge-only commit. Fixes made after that merge are separately described below.

| File | Class | Accounting |
|---|---|---|
| `db/migrations/0124-service-escalation-cases.sql` | unchanged | Added/removed lines identical. |
| `db/seed-service-escalations.sql` | unchanged | Added/removed lines identical. |
| `docs/contracts/service-escalations.md` | unchanged | Added/removed lines identical. |
| `docs/contracts/service-findings.md` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `docs/decisions/findings-figma-design.md` | a | Already on main; removed from contribution. |
| `docs/decisions/service-escalations-native.md` | unchanged | Added/removed lines identical. |
| `docs/design/access-review/access-review.html` | unchanged | Added/removed lines identical. |
| `docs/design/access-review/capabilities.js` | unchanged | Added/removed lines identical. |
| `docs/design/access-review/model.js` | unchanged | Added/removed lines identical. |
| `docs/design/access-review/workspace.js` | unchanged | Added/removed lines identical. |
| `docs/design/development/component-bindings/2026-10-31-service-findings.json` | a | Already on main; removed from contribution. |
| `docs/design/development/component-bindings/2026-10-31-service-findings.md` | a | Already on main; removed from contribution. |
| `docs/design/development/component-bindings/2026-11-01-service-escalations.json` | unchanged | Added/removed lines identical. |
| `docs/design/development/component-bindings/2026-11-01-service-escalations.md` | unchanged | Added/removed lines identical. |
| `docs/design/development/guides.json` | e | Main entries preserved; changed PR entries merged; register +1=387, guides +0=362. |
| `docs/design/development/pages/route-service-escalations.md` | unchanged | Added/removed lines identical. |
| `docs/design/development/pages/route-service-findings.md` | a | Already on main; removed from contribution. |
| `docs/design/development/pages/scope-sv-07.md` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `docs/design/development/pages/scope-sv-08.md` | unchanged | Added/removed lines identical. |
| `docs/design/development/register.json` | e | Main entries preserved; changed PR entries merged; register +1=387, guides +0=362. |
| `docs/guides/pages/guide.route-service-escalations.md` | unchanged | Added/removed lines identical. |
| `docs/standards/ui-baselines/module-integrations/sv07-findings.json` | a | Already on main; removed from contribution. |
| `docs/standards/ui-baselines/module-integrations/sv08-escalations.json` | unchanged | Added/removed lines identical. |
| `docs/status/2026-10-31-service-escalations.md` | unchanged | Added/removed lines identical. |
| `docs/status/2026-10-31-service-findings-ui.md` | a | Already on main; removed from contribution. |
| `docs/status/2026-11-01-service-escalations-native.md` | unchanged | Added/removed lines identical. |
| `docs/testing/evidence/service-escalations/README.md` | unchanged | Added/removed lines identical. |
| `docs/testing/evidence/service-findings/README.md` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/assignment-1440.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/browser.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/database.tap` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/fixture-browser-retry.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/fixture-browser.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/fixture-lint.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/fixture-startup.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/foundation.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/http.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/inspection-isolated.tap` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/inspection-main-control.tap` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/inspection-retry.tap` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/lint.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/manifest.json` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/naming.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/phone-guard-before-fix.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/recurrence-1440.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/register-1024.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/register-1440.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/register-320.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/register-390.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/reports-browser.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/reports-main-control.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/reports-menu-only.diff` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-1024.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-1440.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-320-bottom.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-320-middle.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-320.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-390-bottom.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-390-middle.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/snapshot-390.png` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/static-checks.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/status.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/studio.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/timeout-main-control.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/typecheck.txt` | a | Already on main; removed from contribution. |
| `docs/testing/evidence/service-findings/ui/unit.txt` | a | Already on main; removed from contribution. |
| `scripts/check-access-review-browser.mjs` | unchanged | Added/removed lines identical. |
| `scripts/check-access-review-model.mjs` | unchanged | Added/removed lines identical. |
| `scripts/demo-upgrade.ts` | c | Keep 0123, then 0124/seed124; latest version/gate main 123 → 124; both comment paragraphs. |
| `scripts/http-suite.ts` | unchanged | Added/removed lines identical. |
| `scripts/migration-registry.ts` | c | Keep 0123, then 0124/seed124; latest version/gate main 123 → 124; both comment paragraphs. |
| `src/access/capabilities.ts` | unchanged | Added/removed lines identical. |
| `src/activities/activities.ts` | unchanged | Added/removed lines identical. |
| `src/app/(business)/service/escalations/page.tsx` | unchanged | Added/removed lines identical. |
| `src/app/(business)/service/findings/page.tsx` | a | Already on main; removed from contribution. |
| `src/app/api/v1/service/escalations/[id]/commands/route.ts` | unchanged | Added/removed lines identical. |
| `src/app/api/v1/service/escalations/[id]/files/route.ts` | unchanged | Added/removed lines identical. |
| `src/app/api/v1/service/escalations/[id]/route.ts` | unchanged | Added/removed lines identical. |
| `src/app/api/v1/service/escalations/equipment/[id]/support-route/route.ts` | unchanged | Added/removed lines identical. |
| `src/app/api/v1/service/escalations/options/route.ts` | unchanged | Added/removed lines identical. |
| `src/app/api/v1/service/escalations/route.ts` | unchanged | Added/removed lines identical. |
| `src/components/activity-screens.tsx` | unchanged | Added/removed lines identical. |
| `src/components/report-register.tsx` | a | Already on main; removed from contribution. |
| `src/components/service-escalations-command.tsx` | unchanged | Added/removed lines identical. |
| `src/components/service-escalations-create.tsx` | unchanged | Added/removed lines identical. |
| `src/components/service-escalations-menu.tsx` | unchanged | Added/removed lines identical. |
| `src/components/service-escalations.css` | unchanged | Added/removed lines identical. |
| `src/components/service-escalations.tsx` | unchanged | Added/removed lines identical. |
| `src/components/service-findings-action.tsx` | a | Already on main; removed from contribution. |
| `src/components/service-findings-menu.tsx` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `src/components/service-findings-time.tsx` | a | Already on main; removed from contribution. |
| `src/components/service-findings.css` | a | Already on main; removed from contribution. |
| `src/components/service-findings.tsx` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `src/components/service-review-menu.css` | a | Already on main; removed from contribution. |
| `src/components/shell-phone-header.tsx` | a | Already on main; removed from contribution. |
| `src/platform/permissions.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/commands.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/context.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/evidence.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/model.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/pack-source.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/reads.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/states.ts` | unchanged | Added/removed lines identical. |
| `src/service/escalations/types.ts` | unchanged | Added/removed lines identical. |
| `src/service/findings/model.ts` | a | Already on main; removed from contribution. |
| `src/service/findings/next-action.ts` | unchanged | Added/removed lines identical. |
| `src/service/findings/reads.ts` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `src/service/findings/recurrence.ts` | a | Already on main; removed from contribution. |
| `src/service/findings/window.ts` | a | Already on main; removed from contribution. |
| `src/shared/receipts.ts` | unchanged | Added/removed lines identical. |
| `src/shell/module-workspaces.ts` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `src/shell/navigation.ts` | a | Findings #801 lines now on main; SV-08 additions retained. |
| `src/shell/phone-header.ts` | a | Already on main; removed from contribution. |
| `tests/browser/service-escalations.spec.ts` | unchanged | Added/removed lines identical. |
| `tests/browser/service-findings.spec.ts` | d | Main #801 tests retained; only canEscalate fixture flag, response capability, and SV08 handover test reapplied. |
| `tests/database/access-application.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/access-inspection.test.ts` | unchanged | Added/removed lines identical. |
| `tests/database/access-local-teams.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/access-requests.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/access-review-attestations.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/access-withdrawal.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/assistant-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/calls-migration.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/conversations-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/cpq-packages-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/cpq.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/customer-delivery-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/discovery-creation.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/document-library.test.ts` | b, f | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. Main’s multiline layout changes which surrounding lines enter the patch. |
| `tests/database/estimating-catalogue.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-capacity-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-fx-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-import-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-landed-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-reimport-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/excel-source-pricing-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/field-customer-response.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/field-timer-boundaries.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/field.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/finance-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/inspection-attribution-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/intake.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/leads-amendments.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/leads-projects-integration.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained.Current atVersion: main 123 → 124. |
| `tests/database/maintenance-upgrade.test.ts` | unchanged | Added/removed lines identical. |
| `tests/database/nursery-assessment.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/nursery-automation.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/offline.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/outcome-sources.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/output-actions.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/packs.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/planner.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/policy-persistence.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained.Latest main 123 → 124. |
| `tests/database/products-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained.Retain starting point 123, add 124; latest main 123 → 124. |
| `tests/database/project-baselines.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/project-commercial-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained.From-0025: 85 plus tail → length 99 (26–124). |
| `tests/database/project-programme.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/project-raid.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/project-specialist-handover-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/project-specialist-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained.From-0025: 85 plus tail → length 99 (26–124). |
| `tests/database/project-specialist-work-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quality-upgrade.test.ts` | unchanged | Added/removed lines identical. |
| `tests/database/quotation-allocation-shortfall.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-conversion.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-disposition.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-material-resolution.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-receipt-correction.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-release.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-reservation-reconciliation.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-response.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-supply-followup.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-task-branch.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-task-chain.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-task-dependency.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-task-diamond.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/quotation-task-merge.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/reports.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/sales-delivery-binding.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/sales-estimating-binding.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/service-escalation-inspection.test.ts` | unchanged | Added/removed lines identical. |
| `tests/database/service-escalations.test.ts` | unchanged | Added/removed lines identical. |
| `tests/database/service-finding-next-action-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/service-findings-recurrence.test.ts` | a | Already on main; removed from contribution. |
| `tests/database/site-readiness-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/site-surveys-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/template-drafts-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/template-publication-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/template-renderer-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/database/template-use-upgrade.test.ts` | b | Version-list tails: OLD 122,124 → NEW 122,123,124; removed baseline 122 → 123. Earlier values retained. |
| `tests/demo/upgrade.test.ts` | b | Added-migration total: main 106 → 107 (old patch 105 → 106); users unchanged. |
| `tests/helpers/access-inspection-upgrade.ts` | unchanged | Added/removed lines identical. |
| `tests/helpers/engineering-materials-grants.ts` | unchanged | Added/removed lines identical. |
| `tests/helpers/escalations-fixture.ts` | unchanged | Added/removed lines identical. |
| `tests/helpers/findings-fixture.ts` | a | Already on main; removed from contribution. |
| `tests/helpers/service-escalations.ts` | unchanged | Added/removed lines identical. |
| `tests/http/service-escalations.test.ts` | unchanged | Added/removed lines identical. |
| `tests/http/service-findings.test.ts` | a | Already on main; removed from contribution. |
| `tests/unit/phone-header.test.ts` | a | Already on main; removed from contribution. |
| `tests/unit/service-escalations.test.ts` | unchanged | Added/removed lines identical. |
| `tests/unit/service-findings.test.ts` | a | Already on main; removed from contribution. |

## Migration search output

`git grep -lwE '0?123' tests/`

```text
tests/database/access-application.test.ts
tests/database/access-local-teams.test.ts
tests/database/access-requests.test.ts
tests/database/access-review-attestations.test.ts
tests/database/access-withdrawal.test.ts
tests/database/assistant-claude.test.ts
tests/database/assistant-evaluation.test.ts
tests/database/assistant-upgrade.test.ts
tests/database/calls-migration.test.ts
tests/database/conversations-upgrade.test.ts
tests/database/cpq-packages-upgrade.test.ts
tests/database/cpq.test.ts
tests/database/customer-delivery-upgrade.test.ts
tests/database/discovery-creation.test.ts
tests/database/document-library.test.ts
tests/database/estimating-catalogue.test.ts
tests/database/excel-capacity-upgrade.test.ts
tests/database/excel-fx-upgrade.test.ts
tests/database/excel-import-upgrade.test.ts
tests/database/excel-landed-upgrade.test.ts
tests/database/excel-reimport-upgrade.test.ts
tests/database/excel-source-pricing-upgrade.test.ts
tests/database/field-customer-response.test.ts
tests/database/field-timer-boundaries.test.ts
tests/database/field.test.ts
tests/database/finance-upgrade.test.ts
tests/database/inspection-attribution-upgrade.test.ts
tests/database/intake.test.ts
tests/database/leads-amendments.test.ts
tests/database/leads-projects-integration.test.ts
tests/database/maintenance-upgrade.test.ts
tests/database/nursery-assessment.test.ts
tests/database/nursery-automation.test.ts
tests/database/offline.test.ts
tests/database/outcome-sources.test.ts
tests/database/output-actions.test.ts
tests/database/packs.test.ts
tests/database/planner.test.ts
tests/database/policy-persistence.test.ts
tests/database/products-upgrade.test.ts
tests/database/project-baselines.test.ts
tests/database/project-commercial-upgrade.test.ts
tests/database/project-programme.test.ts
tests/database/project-raid.test.ts
tests/database/project-specialist-handover-upgrade.test.ts
tests/database/project-specialist-upgrade.test.ts
tests/database/project-specialist-work-upgrade.test.ts
tests/database/quotation-allocation-shortfall.test.ts
tests/database/quotation-conversion.test.ts
tests/database/quotation-disposition.test.ts
tests/database/quotation-material-resolution.test.ts
tests/database/quotation-receipt-correction.test.ts
tests/database/quotation-release.test.ts
tests/database/quotation-reservation-reconciliation.test.ts
tests/database/quotation-response.test.ts
tests/database/quotation-supply-followup.test.ts
tests/database/quotation-task-branch.test.ts
tests/database/quotation-task-chain.test.ts
tests/database/quotation-task-dependency.test.ts
tests/database/quotation-task-diamond.test.ts
tests/database/quotation-task-merge.test.ts
tests/database/reports.test.ts
tests/database/sales-briefs.test.ts
tests/database/sales-delivery-binding.test.ts
tests/database/sales-estimating-binding.test.ts
tests/database/sales-workflows.test.ts
tests/database/service-finding-next-action-upgrade.test.ts
tests/database/site-readiness-upgrade.test.ts
tests/database/site-surveys-upgrade.test.ts
tests/database/template-drafts-upgrade.test.ts
tests/database/template-publication-upgrade.test.ts
tests/database/template-renderer-upgrade.test.ts
tests/database/template-use-upgrade.test.ts
tests/demo/deploy_workflow_test.py
tests/scripts/test_quality_observer_block.py
tests/unit/assistant-evaluation.test.ts
tests/unit/assistant.test.ts
tests/unit/calls-numbers.test.ts
tests/unit/cost-source-register-model.test.ts
tests/unit/customer-delivery.test.ts
tests/unit/day-timeline.test.ts
tests/unit/department-navigation.test.ts
tests/unit/development-workspace.test.ts
tests/unit/quality-asset-observer.test.ts
tests/unit/quality-packet-network.test.ts
tests/unit/service-escalations.test.ts
tests/unit/specialist.test.ts
```

`git grep -lwE '0?124' tests/`

```text
tests/database/access-application.test.ts
tests/database/access-inspection.test.ts
tests/database/access-local-teams.test.ts
tests/database/access-requests.test.ts
tests/database/access-review-attestations.test.ts
tests/database/access-withdrawal.test.ts
tests/database/assistant-upgrade.test.ts
tests/database/calls-migration.test.ts
tests/database/conversations-upgrade.test.ts
tests/database/cpq-packages-upgrade.test.ts
tests/database/cpq.test.ts
tests/database/customer-delivery-upgrade.test.ts
tests/database/discovery-creation.test.ts
tests/database/document-library.test.ts
tests/database/estimating-catalogue.test.ts
tests/database/excel-capacity-upgrade.test.ts
tests/database/excel-fx-upgrade.test.ts
tests/database/excel-import-upgrade.test.ts
tests/database/excel-landed-upgrade.test.ts
tests/database/excel-reimport-upgrade.test.ts
tests/database/excel-source-pricing-upgrade.test.ts
tests/database/field-customer-response.test.ts
tests/database/field-timer-boundaries.test.ts
tests/database/field.test.ts
tests/database/finance-upgrade.test.ts
tests/database/inspection-attribution-upgrade.test.ts
tests/database/intake.test.ts
tests/database/leads-amendments.test.ts
tests/database/leads-projects-integration.test.ts
tests/database/maintenance-upgrade.test.ts
tests/database/nursery-assessment.test.ts
tests/database/nursery-automation.test.ts
tests/database/offline.test.ts
tests/database/outcome-sources.test.ts
tests/database/output-actions.test.ts
tests/database/packs.test.ts
tests/database/planner.test.ts
tests/database/policy-persistence.test.ts
tests/database/products-upgrade.test.ts
tests/database/project-baselines.test.ts
tests/database/project-commercial-upgrade.test.ts
tests/database/project-programme.test.ts
tests/database/project-raid.test.ts
tests/database/project-specialist-handover-upgrade.test.ts
tests/database/project-specialist-upgrade.test.ts
tests/database/project-specialist-work-upgrade.test.ts
tests/database/quotation-allocation-shortfall.test.ts
tests/database/quotation-conversion.test.ts
tests/database/quotation-disposition.test.ts
tests/database/quotation-material-resolution.test.ts
tests/database/quotation-receipt-correction.test.ts
tests/database/quotation-release.test.ts
tests/database/quotation-reservation-reconciliation.test.ts
tests/database/quotation-response.test.ts
tests/database/quotation-supply-followup.test.ts
tests/database/quotation-task-branch.test.ts
tests/database/quotation-task-chain.test.ts
tests/database/quotation-task-dependency.test.ts
tests/database/quotation-task-diamond.test.ts
tests/database/quotation-task-merge.test.ts
tests/database/reports.test.ts
tests/database/sales-delivery-binding.test.ts
tests/database/sales-estimating-binding.test.ts
tests/database/service-finding-next-action-upgrade.test.ts
tests/database/site-readiness-upgrade.test.ts
tests/database/site-surveys-upgrade.test.ts
tests/database/template-drafts-upgrade.test.ts
tests/database/template-publication-upgrade.test.ts
tests/database/template-renderer-upgrade.test.ts
tests/database/template-use-upgrade.test.ts
tests/helpers/access-inspection-upgrade.ts
tests/helpers/engineering-materials-grants.ts
tests/projects-ui/gantt.spec.ts
tests/unit/desktop-shell.test.ts
```

Every version-list hit for 123 also contains 124. The 18 filenames with only 123 use unrelated IDs, fixture quantities, phone numbers, amounts or dates; their matching lines were inspected. Historical starting points remain intact.
