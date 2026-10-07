# Native Maintenance and Warranty handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation delivered with local synthetic verification; owner/business/device acceptance pending. No deployment or external transaction.

## Current integration — 7 October 2026

The contribution is reconciled with main `fbf2ed3` (#356) on `codex/maintenance-warranty-completion`, preserving both Maintenance migration/seed 0051 and ES-07 migration 0072. Supply’s 0049 remains unchanged. The combined permission contract contains 120 capabilities. The decision uses stable ID PPO-MA-NATIVE-DEC, preserving Supply’s ADR-0049. Source and design-register integration are complete; the [integration ledger](../testing/evidence/maintenance-warranty/integration/README.md) records exact source checkpoints, current verification and failures separately. No deployment or business acceptance is claimed.

[PR #357](https://github.com/deanrfiedler-gif/powerplants-one/pull/357) is the reviewable contribution. The earlier `7855132` CI finished with 45 successful checks and two failures: the Maintenance MA05 singleton test assumption and its consequent Application aggregate. The repaired test compares exact before/after sets for two permitted customers and restores grants after verifying revocation; its complete ten-case file passed. Reconciliation `34aa32a` retains both migration ledgers, the exact 22 Maintenance grant additions, the 21 newly applied versions after 0050 and 54 hosted-demo additions after the retained baseline. The reviewed existing-demo gate is 72, matching main.

Current-source verification passed 34 database cases, 13 focused units, one HTTP case, 20 compiled browser checks (11 retained skips), full build/lint/TypeScript and register/foundation/naming checks. Actual application/PostgreSQL restart preserves 728 original rows across 37 tables and three stored files; all three original operation lookups/replays add no effects after one explicitly asserted sign-in audit event. Five viewport measurements and five inspected captures remain bounded agent evidence. Fresh delivery-head CI is tracked on the PR and is not inferred from these local results. The integration ledger retains earlier failures, baseline comparisons and every acceptance limitation.

Native Supply now exists. Warranty’s return receiving bridge remains unimplemented; retained external evidence does not create Supply or ERP transactions. The earlier source-specific results below are historical and do not verify the combined tree.

## Retained original-branch checkpoint

All migration 0049, 101-capability and SC-08-unavailable references below describe the retained original branch. They are superseded for current integration by the checkpoint above.

## Baseline and scope

The authorised programme implements MA-01–MA-07 / SVC-12.1–SVC-12.5, linked to PPO-015 (#15), AT-19/AT-33 and relevant AT-25. Fetched main was `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. Open PR #314 was unrelated ES-02 documentation. Native Equipment/Sales/Engineering/cost-source work through migration 0048 was present; MA and SC-08 native returns were absent. The original `docs/field-quality-build-plan` checkout and its unrelated edits were preserved. Implementation uses `feat/maintenance-warranty-native` in a separate worktree.

## Delivered application

Seven permission-scoped registers and seven detail workspaces use the current shell and source guides. Typed migration 0049 preserves agreements, entitlement decisions, task revisions, original-due occurrences, renewal reviews, warranty cases/customer outcomes and supplier recovery. Source revisions and decision events are immutable. The [contract](../contracts/maintenance-warranty-api.md) records exact commands, receiving rules and bounded reads; [PPO-MA-NATIVE-DEC](../decisions/maintenance-warranty-native.md) records architecture and alternatives.

Existing Work Order coverage remains separate. Owned requests enter real Service intake; reviewed Service results are checked against exact authority, task and asset evidence. Equipment remains canonical and marks affected plans for review. Sales Aftercare reads native agreement/renewal sources. SC-08 and live ERP receiving remain explicitly unavailable; external evidence does not simulate their transactions.

## Verification ledger

The tested application implementation is `60e2da3ea56f599faf24ca9b6a54dd5792c37715`, based on incorporated main `2173cc64eed54b1e3fb8334495f7cd924206d13f`. Evidence/documentation delivery follows without changing those application bytes. See the [evidence index](../testing/evidence/maintenance-warranty/README.md) for the exact capture manifest, inspected-image subset, logs and restart comparison. The PR records the final delivery head and its CI status; CI is not inferred from local results.

Commands ran in an isolated worktree on Windows with Node 24.21.0, PostgreSQL 16, Chrome 154.0.8037.58 and Playwright 1.63.0. Database/HTTP commands load a private temporary environment file for `ppo_synthetic_test` on port 55499; compiled browser tests target port 3099. In the commands below, `ENV` means that environment-file path, not a committed credential. `npm.cmd` was used on Windows.

| Check | Executed command / selection | Actual result |
|---|---|---|
| Native domain and real Service journeys | `node --env-file=ENV --import tsx --test --test-concurrency=1 --test-timeout=180000 tests/database/maintenance.test.ts tests/database/maintenance-service.test.ts` | 13 passed, zero failed; [log](../testing/evidence/maintenance-warranty/logs/ma-domain-final.txt) |
| HTTP authority, receipts and competing versions | `node --env-file=ENV --import tsx --test tests/http/maintenance.test.ts` | 1 passed, zero failed; [log](../testing/evidence/maintenance-warranty/logs/ma-http-release.txt) |
| Native desktop and phone browser | `node --env-file=ENV node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts tests/browser/maintenance.spec.ts --no-deps --reporter=list` | 8 passed in 3.2 minutes; all 14 routes and exact guide keys; [log](../testing/evidence/maintenance-warranty/logs/ma-browser-release.txt) |
| Full unit run | `npm.cmd run test:unit` | 425 executed: 421 passed, 4 Windows baseline failures; [log](../testing/evidence/maintenance-warranty/logs/unit-all-final.txt) |
| Current-main baseline | `node --import tsx --test tests/unit/document-store.test.ts tests/unit/recovery.test.ts tests/unit/warm-routes.test.ts` on detached `2173cc6` | 7 executed: 3 passed, the same 4 failed; [log](../testing/evidence/maintenance-warranty/logs/unit-current-main-baseline.txt) |
| Final shell navigation | `node --import tsx --test tests/unit/department-navigation.test.ts` | 6 passed, including all 14 Maintenance/Warranty route families; [log](../testing/evidence/maintenance-warranty/logs/nav-final.txt) |
| Cross-domain migration and seed assertions | Selected upgrade/fresh-install cases in Estimating, DR-01, Field, Finance, Leads/Projects, Offline, Packs, Planner, Quality, Reports and hosted-demo upgrade files | Initial run: 18 passed, 2 cancelled on timeout and 1 after-hook failure. The two timed-out upgrade cases passed on replay; complete hosted-demo upgrade and Equipment suites then passed 15/15. See disposition below. |
| Equipment and hosted-demo regression | Complete `tests/database/equipment.test.ts` and `tests/demo/upgrade.test.ts`, serial under the same synthetic environment | 15 passed, zero failed; [log](../testing/evidence/maintenance-warranty/logs/demo-equipment-final.txt) |
| Build / static | `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run typecheck` | Passed; final build also completes TypeScript and all route generation. Retained logs are in the evidence directory. |
| AD-01 generated contract | `node scripts/check-access-review-model.mjs`; `node scripts/check-access-review-browser.mjs` | 107 model groups and 40 browser groups passed; generated source contains all 101 capabilities. |
| Documentation and register | `python scripts/check_foundation.py`; `python scripts/check_prototype.py`; `python scripts/check_naming.py`; `npm.cmd run studio:check`; `git diff origin/main --check` | Passed. Studio: 323 entries, 169 routes, 30 components; review states remain unreviewed, with no stale fingerprints. All 78 parent IDs retained. |
| Focus, form sizing and reflow | Evidence `layout-proof.mjs` against the compiled app, without submitting | Five viewports passed; Enter/Space, Tab/Shift+Tab, visible focus, phone input fonts >=16 px and controls >=44 px. 720 by 480 is a 200% reflow equivalent, not physical zoom/device proof. |
| Durable persistence | `scripts/maintenance-restart-proof.ts write`, verified isolated app/PostgreSQL restart, then `verify` with changed server PID | All seven families, twelve typed tables and the original receipt/audit/outbox snapshot retained exactly; original receipt GET and POST retry add no effects. [Proof](../testing/evidence/maintenance-warranty/restart-proof.json) |

The [initial shared-upgrade log](../testing/evidence/maintenance-warranty/logs/upgrade-regression.txt) is deliberately retained as a failed run. Field P07 and Finance P10 exceeded their timeout during a long machine interruption; [serial replay](../testing/evidence/maintenance-warranty/logs/upgrade-rerun.txt) passed both. A filtered hosted-demo run excluded the final restoration case after a deliberate corrupt-checksum scenario, so its after-hook failed; running the complete five-case file subsequently passed. No applied migration was rewritten to suppress this. The complete Equipment file passed alongside it.

The four unit failures are two private document-store path assertions, one recovery-directory error assertion and the Windows route-separator assertion. They reproduce on untouched current main, not just the original base. No new unit regression is claimed; the full Ubuntu CI lane remains the broader platform check. Intermediate browser proof mistakes (an ambiguous locator and a document-only overflow detector) were corrected; the final detector covers the main pane and workspace and passes its injected-overflow negative control. The final eight-case browser run also checks that no Maintenance route renders the fallback breadcrumb.

Visual inspection covers all seven native registers and details on desktop and phone, all six desktop Warranty views, three unchanged source references at both widths, focused forms at five widths, and phone cards below the filters. The manifest marks 56 inspected captures separately from ten repeated automated captures. Native layout adaptations remain proposed; no review fingerprint is promoted to accepted. Physical phones, screen readers and owner design review remain open.

## Review boundaries

The original r01 HTML/report and all 78 parent requirement IDs remain unchanged. Native adaptations (cards, wrapping, disclosures, current route names/shell, server persistence) are exposed in every live page contract. Guide and visual review records remain Draft/Needs review. Local synthetic proof does not establish operational warranty policy, production integration, customer communications, owner acceptance or deployment. No live messages, credits, stock movements or bookings are caused by this implementation task.

## Traceability and executable evidence

| Parent acceptance | Concrete proof | Boundary retained |
|---|---|---|
| AT-19 / SVC-12.1, SVC-12.2 | Overlapping/concurrent generation, exact retry, immutable original due, sourced deferral, superseded entitlement, excluded physical facility | Source dates never invent coverage; unresolved decisions stay owned |
| AT-19 / SVC-12.3 | Exact evidence review, changed-plan authority refusal, partial approval and separate credit/disposition | Work, goodwill, supplier approval and Finance are independent |
| AT-33 / SVC-12.5 | Applied canonical replacement plus relocation and retirement; original occurrences unchanged, future plans ReviewRequired, original/successor identity retained | No automatic warranty or maintenance transfer |
| AT-33 / SVC-12.3 | Real partial and completed reviewed Service reports, exact task mapping, current accepted customer update; prepared supplier claim remains open after customer resolution | Reviewed work alone does not resolve the customer or recover money |
| AT-25 / SVC-12.4 | CRM relationship review and Service technical review create distinct owned Activities; reservations create customer follow-up | A proposal/Activity does not renew a contract or create a booking |

The complete native route pairs are `/maintenance/agreements`, `/maintenance/coverage`, `/maintenance/plans`, `/maintenance/due`, `/maintenance/renewals`, `/warranty/cases` and `/warranty/supplier-recovery`, each with `/{id}`. The API uses `/api/v1` with the same roots; due/case receiving and bounded options are separately specified in the contract.

Migration 0049 adds nine capabilities: `maintenance.read`, `maintenance.manage`, `maintenance.assess`, `maintenance.agreement.approve`, `warranty.read`, `warranty.manage`, `warranty.assess`, `warranty.goodwill` and `warranty.recovery`. Existing Activity, Service and Finance duties still apply at their receiving boundary. Seed 49 adds grants to existing scoped synthetic users; it adds no user or invited tester rights. The generated AD-01 contract contains 101 capabilities.

Main advanced to `2173cc64eed54b1e3fb8334495f7cd924206d13f` while validation ran. Merge `7e7a90a` retains its ES-02 documentation and our native work; there is no migration collision. Initial implementation `d4091b0` was followed by the tested refinement `60e2da3ea56f599faf24ca9b6a54dd5792c37715`. Fetched main was checked again before delivery and had not advanced.

## Remaining external and acceptance work

SC-08 native return/stock custody is unavailable. The typed recovery record can retain ordered external return evidence, with `SC08Unavailable` explicit; it cannot create inventory movements or an RMA transaction. MYOB remains the ERP authority. Finance-authorised credit evidence records an exact external company/reference and bounded amount, but is not a live ERP posting or independent confirmation of payment. Customer and supplier communications are retained evidence, not messages sent by this application.

Maintenance and Warranty code completion does not establish operational contract terms, warranty policy, goodwill policy or business acceptance. Those decisions require their existing authorised owners and exact source evidence. Owner visual review, real-device/screen-reader acceptance, final PR CI and normal review/merge remain separate. No public deployment was performed, and issue #15 is referenced rather than closed.
