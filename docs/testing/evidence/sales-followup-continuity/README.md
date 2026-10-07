# Reviewed follow-up back to Sales execution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Review: synthetic implementation verification passed; owner and paired visual acceptance pending.

LC-17 implements increment 6 of the [continuity programme](../../../contracts/lead-to-delivery-continuity.md), under the [follow-up decision](../../../decisions/sales-followup-continuity.md). Its application parent is PR #364 at `e8dd290`; the separate Search test repair `14e76da` is the immediate commit parent. Native Activities, Leads and qualified Deals remain the authorities. No migration, grant, seed, user, dependency or deployment is added.

An owned dated Internal customer review can explicitly link to one matching open Sales record. Native creation saves independently and returns to an exact comparison; a Lead designation of next action remains its own native command. A restricted or completed original can create a separately worded Internal RelationshipReview without changing the original. The new command retains the exact source snapshot/version and all native links. Current original provenance and target permissions govern link/review receipt recovery; later completion does not cancel an accepted original link. Native creation recovery uses its own native authority. Aftercare receiving acknowledgement remains separate.

The native CRM Activity projections previously omitted Project-linked actions. LC-17 enables their existing permission-aware Project branch in Lead/Deal detail, worklist and planning-gap projections, guarded for pre-Projects databases.

## Executed proof

| Check | Actual result | Evidence |
|---|---|---|
| Final focused database | 8/8 passed, 140.47 seconds | [Final database log](database-final.log) |
| Earlier combined compatibility | 15/15 passed, 403.43 seconds: seven earlier follow-up cases, four CRM I2 cases and four Leads/Projects installation/upgrade cases | [Combined database log](database-combined.log) |
| Compiled browser | 18/18 passed, 2.1 minutes; desktop and phone | [Final browser log](browser-final.log) |
| Focused native units | 5/5 passed | [Unit log](unit.log) |
| Production compilation | Passed on final application bytes | [Final build log](build-final.log) |
| TypeScript and changed-file lint | Exit 0; tools produce no output on success | [TypeScript](typecheck.log), [lint](lint.log) |
| Foundation, prototype, naming, studio | Passed; 344 page entries, 190 routes, 39 components; reviews remain pending | [Foundation](foundation.log), [prototype](prototype.log), [naming](naming.log), [studio](studio.log) |

Database cases cover competing/exact duplicate links, retained owners/dates/native rows, native Lead planning and conversion with the Project Activity, qualified Deal linking without changing its designated initial action, separate Internal review from a restricted completed source, stale source/target and unchecked comparison refusal, incompatible site/closed Lead/non-owner refusal, current Project permission removal, nested original-source permission removal and a late outbox failure rolling back every effect. The final eight-case run adds nested provenance and the final Lead conversion assertions after the combined compatibility run; the earlier combined run is not presented as final-source coverage of those additions.

The eighteen browser cases comprise six LC-17 cases, six retained native CRM/LC-11/Projects journeys and six separate [Search readiness repair](../won-delivery-continuity/ci-search-readiness/README.md) checks. LC-17 exercises actual native Project and Service records, native Lead and qualified Deal forms, lost-response/reload recovery, explicit linking, native next-action planning, original receipt recovery after completion, stale comparison and denied-refresh clearing. The browser denial uses a controlled 403; actual grant removal is covered by the database tests.

No database reset or `.next` rebuild overlapped the final browser execution. The later test-only synchronisation repairs do not change compiled application bytes.

## Retained failures and repairs

[Initial database proof](database-initial.log) failed on an incorrect audit timestamp column; the live schema uses `occurred_at`. The [next run](database-repair.log) found the missing Project branch in native Lead Activity projection and an invalid cross-company fixture. The repaired [seven-case run](database-projections.log) passed. The replacement fixture checks a different native Site in the same company; no cross-company test is claimed from that fixture.

The [initial build](build-initial.log) rejected an overly narrow UUID type in the browser fixture; an explicit link-array type repaired it. [Repair](build-repair.log), [modal integration](build-modal.log), [intermediate](build-intermediate.log) and final builds are retained. Native Lead source context sits inside the existing scrollable form body. Explicit Project source links and their labels were corrected before the final application build.

The [initial browser run](browser-initial.log) passed ten of twelve cases; two clicked the list's Add lead control behind an open modal instead of its native Save lead control. The [intermediate run](browser-intermediate.log) passed fourteen of eighteen: both Project cases read the API before the native next-action save response, and both new Search controls assumed one GET although the app issues two. The final tests await the exact native save response and remove only the invalid Search request-count assumption. Saved-action, failed-read and layout assertions remain. Initial/intermediate screenshots and contexts retain their prefixes; final captures are separate. Text copies normalise line endings, ANSI controls and trailing whitespace.

## Captures and review boundary

Four final captures retain the Project-to-Lead fixed comparison and completed separate-review-to-Deal history at 1440 px desktop and 390 px phone. The implementation agent inspected the phone comparison and desktop retained history: customer/site/owner/date, native source links, explicit command and retained history are legible in those captured states. These are bounded screenshots, not a paired baseline or full visual acceptance. Existing component/page reviews remain pending; exact new-state mockups are missing and recorded in the working design register.

- [sales-followup-LC-17-Proje-c41a8-plans-the-retained-Activity-desktop-chromium-project-lead-link-review.png](final-sales-followup-LC-17-Proje-c41a8-plans-the-retained-Activity-desktop-chromium-project-lead-link-review.png)
- [sales-followup-LC-17-Proje-c41a8-plans-the-retained-Activity-mobile-chromium-project-lead-link-review.png](final-sales-followup-LC-17-Proje-c41a8-plans-the-retained-Activity-mobile-chromium-project-lead-link-review.png)
- [sales-followup-LC-17-restr-ba106-ecovery-survives-completion-desktop-chromium-retained-review-deal-history.png](final-sales-followup-LC-17-restr-ba106-ecovery-survives-completion-desktop-chromium-retained-review-deal-history.png)
- [sales-followup-LC-17-restr-ba106-ecovery-survives-completion-mobile-chromium-retained-review-deal-history.png](final-sales-followup-LC-17-restr-ba106-ecovery-survives-completion-mobile-chromium-retained-review-deal-history.png)

## Reproduction and limits

Environment: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16, isolated `ppo_synthetic_test`, compiled loopback application, Playwright 1.63.0 and Chrome 154.0.8037.98. Private environment configuration is excluded. The existing database safety guard refuses other database names.

```sh
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/sales-followup.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/sales-followup.test.ts tests/database/crm-i2.test.ts tests/database/leads-projects-integration.test.ts
node --import tsx --test tests/unit/leads-validation.test.ts tests/unit/crm-worklist-location.test.ts
npm run build
npx tsc --noEmit
npx playwright test -c playwright.compiled.config.ts tests/browser/sales-followup.spec.ts tests/browser/leads.spec.ts tests/browser/projects-gantt.spec.ts tests/browser/crm.spec.ts tests/browser/search-navigation.spec.ts tests/browser/sh-platform.spec.ts --grep "LC-17|LC-11|Projects navigation|CA-01/04/13|search geometry|search readiness|SH review perspectives" --project desktop-chromium --project mobile-chromium --no-deps
python -X utf8 scripts/check_foundation.py
python -X utf8 scripts/check_prototype.py
python -X utf8 scripts/check_naming.py
npm run studio:check
```

Lint targets every changed TypeScript/TSX file. [Manifest](manifest.json) hashes the staged Git blobs for changed implementation/tests, affected working contracts and retained evidence; it excludes itself. Empty successful TypeScript/lint logs are intentionally retained with the exit result recorded above. New routes are API routes only; no page discovery stub or source-route count change is required.

No live records, integrations or customer communications are used. Standalone HTTP/restart, full regression, 200% zoom, screen-reader, physical-device, owner/business acceptance and deployment are not claimed. Those broader checks were outside this bounded increment; final-head CI runs separately. The programme is implemented with local synthetic proof, not declared production-complete.
