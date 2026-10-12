# Quotation register backend evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 12 October 2026. Source dependency: review-queue PR #449 at `712ba2d530db0c4dd144cc5808fb44eb5ba6560f`, based on merged main `6c164712f7120c89c0d2f5dd24833865696b4968`. [Contract](../../../decisions/quotation-register-backend.md), [backend plan](../../../delivery/backend-completion-plan.md), [exact source/test hashes](manifest.json). Synthetic fixtures only. Independent review, owner acceptance and deployment remain separate.

## Executed checks

| Check | Observed result |
|---|---|
| Database register and native regression cases | 8/8 pass: all five new register cases plus existing ES-05 exact preparation/issue, ES-06 exact acceptance/recovery and ES-07 exact native conversion journeys |
| Focused units | 9/9 pass: register query/stage rules and existing ES-05/06/07 validation/model contracts |
| Compiled HTTP | 4/4 pass: new current-row/history API plus original ES-05/06/07 journeys; 401/403/404, no-store, strict queries, immutable revision links, history continuation and unsupported write refusal |
| Static and build | Full lint, TypeScript and compiled build pass; changed-file lint and TypeScript rechecked after final test changes |
| Documentation and design register | Foundation, PP-01 prototype, naming and live register checks pass; existing draft/stale reviews remain visible |

The database cases use native commands and actual render/issue/response/conversion evidence. They prove one current row per quotation; revision history; return, approval and unknown distribution resolution; retained issued facts after source changes; response holds after a corrected acceptance; exact converted identity; a later Draft without inherited conversion; denied Supply evidence producing an unknown stage; literal search; owner/customer filters; bounded ordering and filtered continuation; separate stable quotation and revision IDs; other-company and revoked recipient/read access; and unchanged receipt/audit/lifecycle-event counts after reads. The older-quotation case creates 101 newer native estimates and still finds the retained quotation directly.

The original ES-05/06/07 regression cases retain their file/receipt preservation and native target assertions. No business command, grant, migration, seed, dependency or issued reference is changed. Added tests are registered in the existing ES-05 database/HTTP files so the current CI lanes execute them.

An initial run passed three new cases and rejected two source-change fixtures because they incorrectly passed create-only fields to the strict native save command. The fixtures were corrected to the existing save schema. The final eight-case run passes without changing assertions, command validation or test deadlines.

The first server readiness probe preceded the listen event and received connection refusal. HTTP execution started only after `/login` returned 200. The compiled build ID and nine exact source/test hashes are retained in the manifest.

## Reproduction

Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 with the repository test lock capacity and the existing document renderer. Use an explicitly local synthetic environment with a disposable database named `ppo_synthetic_test`; keep configuration and generated output outside Git. Run database suites serially and wait for the compiled server to listen before HTTP tests.

```text
node --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern="quotation register|^ES0[567] exact" tests/database/quotation-release.test.ts tests/database/quotation-response.test.ts tests/database/quotation-conversion.test.ts
node --import tsx --test --test-concurrency=1 tests/unit/quotation-register.test.ts tests/unit/quotation-release.test.ts tests/unit/quotation-response.test.ts tests/unit/quotation-conversion.test.ts
npm run build
node --import tsx scripts/local-server.ts --compiled
node --import tsx --test --test-concurrency=1 tests/http/quotation-release.test.ts tests/http/quotation-response.test.ts tests/http/quotation-conversion.test.ts
```

## Limits

Catalogue PR #448 merged as `ae83043b55058ba47334c3e9ba431d3538f2a8da` after these local checks. This evidence identifies the unchanged PR #449 dependency and exact new runtime bytes; it does not claim a combined catalogue/backend proof. The subsequent merge preparation incorporates current main through review-queue head `54fb611541567136575267e2afad684d901a8c32`. Eight of these nine source/test fingerprints remain unchanged; the ES-05 database file additionally retains main's exact migration-0085 upgrade assertion. The original local proof is preserved, and fresh combined-head CI is required before merging.

This is a backend API increment. The accepted Quotations page, shell rollout, selection/export and global menu counts remain separate work. Counts describe one authorised candidate window; update ordering describes quotation revision updates, not every later lifecycle event. Historical authority checks have a bounded candidate count, but this is not a production capacity proof. No new browser, visual, restart or business acceptance is claimed.

The full unrelated database/unit suites were not rerun locally for this additive read change; complete PR CI remains separate. The prior [review-queue evidence](../estimating-review-queue/README.md) records three Windows unit failures reproduced on unchanged main; those guards and assertions are preserved. No production adapter, transaction, communication or deployment is exercised.
