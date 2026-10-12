# Reviews and approvals queue backend evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 12 October 2026. Baseline: merged main `6c164712f7120c89c0d2f5dd24833865696b4968`. [Backend contract](../../../decisions/estimating-review-queue.md), [dependency-led plan](../../../delivery/backend-completion-plan.md), [exact runtime/test hashes](manifest.json). All fixtures and quotation output are synthetic. Code delivery, independent review, owner acceptance and deployment remain separate.

## Executed proof

| Check | Observed result |
|---|---|
| Unmodified-main ES-04/ES-05 database baseline | 16/16 pass on dedicated disposable PostgreSQL 16.15 |
| ES-04/ES-05 database suite with queue cases | 21/21 pass, retaining original submission, return, revision applicability, duty, race, rollback, issue, recovery and populated-upgrade assertions |
| Final queue lifecycle replay | 5/5 pass after tightening the carried-forward flag and extending quotation coverage: actual return, newer Draft holding retained evidence, fresh prepared successor, approval, issue and later changed estimate |
| Focused units | 5/5 pass: strict queue query validation and original ES-04/ES-05 model/validation contracts |
| Compiled HTTP | 3/3 pass: existing ES-04 and ES-05 journeys plus the queue route, exact IDs/links, no-store, own-work exclusion, strict validation, 401/403, company isolation and unsupported write refusal |
| Full unit suite | 736 pass / 5 fail; disposition below |
| Static/build | Full lint, TypeScript and compiled build pass; changed-file lint and TypeScript rechecked after the final test additions |
| Documentation | Foundation, PP-01 prototype, naming and live design-register checks pass. ES-08 scope status is reconciled without promoting review evidence |

Queue database cases use native commands and actual retained revisions, not direct inserts standing in for review decisions. They verify independent duties, returned findings/responses, resubmission, price-only applicability, candidate-window pagination, filtered-empty continuation, exact-source denial, expired duties, other-company exclusion and unchanged receipt/audit/review counts after reads. Quotation preparation and PDF rendering use the existing native worker. The final queue replay includes the corrected carried-forward flag; unchanged original ES-04/ES-05 cases were already proved in the 21-case run.

## Failure disposition

The full unit run's two subprocess-startup timeouts (Azure operator CLI and local launcher refusal) passed in the focused serial replay with their original deadlines. Three failures remain: two P06 private document-store directory cases and P12 recovery-directory classification. A clean managed checkout of the exact baseline, with unchanged source and the same locked dependencies, reproduced precisely those three failures (15 pass / 3 fail across the four affected files). No assertion, deadline or storage guard was weakened.

Initial setup used PostgreSQL's default lock capacity; the baseline reset reported `53200`. The dedicated cluster was restarted with the existing repository test setting `max_locks_per_transaction=256`, after which the unchanged-main database suite passed. An initial new fixture supplied a finding ID rejected by the existing strict command schema; removing the unsupported field fixed it. An HTTP attempt started before the compiled server listened and received connection refusal; the recorded successful run followed readiness. An intermediate documentation edit had encoding damage and exceeded the instruction-size limit; original UTF-8 text was restored from Git and the intended additions checked again. These are setup/contribution corrections, not attributed to main.

## Reproduction

Use Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, the locked dependencies and the configured supported document renderer. Database commands require the explicitly local synthetic environment and a disposable database named `ppo_synthetic_test`. Keep private configuration and generated output outside Git. Run database suites serially, then serve the compiled application and run HTTP with its matching `PPO_TEST_ORIGIN`.

```text
node --import tsx --test --test-concurrency=1 tests/database/estimating-review.test.ts tests/database/quotation-release.test.ts
node --import tsx --test --test-concurrency=1 --test-name-pattern="review queue|quotation queue" tests/database/estimating-review.test.ts
node --import tsx --test tests/unit/estimating-review-queue.test.ts tests/unit/estimating-review.test.ts tests/unit/quotation-release.test.ts
npm run build
node --import tsx scripts/local-server.ts --compiled
node --import tsx --test --test-concurrency=1 tests/http/estimating-review.test.ts tests/http/quotation-release.test.ts
```

## Limits

The change adds a read projection; it adds no migration, seed, capability, dependency, durable queue, business command or page. Existing ES-04/ES-05 test files register the added proofs in their current CI lanes. The endpoint deliberately reports counts for one authorised candidate window, not global totals. Historical checks can make reads expensive; a 25-candidate bound is not a production capacity claim. No new browser/visual or restart acceptance was run for this backend-only addition, and unrelated database suites were not rerun locally. Full PR CI is separate. The accepted Reviews & approvals page, shared shell, loading/error/stale states and global menu-count contract remain work. Live providers, business acceptance and deployment are not proved.
