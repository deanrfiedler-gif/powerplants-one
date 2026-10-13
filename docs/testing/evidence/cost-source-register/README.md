# Cost sources register backend evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution date: 12 October 2026. Base: merged main `fe7794b08235c089f215bd5b41a17e33603df21c` after Reviews & approvals #449 and Quotations #450. Branch: `codex/cost-sources-backend`. [Contract](../../../decisions/cost-source-register-backend.md). Synthetic fixtures only; independent review, owner acceptance and deployment remain separate.

## Execution ledger

All eight distinct database cases have passing execution: five new register cases and all three original ES-03 cases. The initial full file passes 8/8; the final expanded revocation case separately passes at the unchanged 120-second deadline. That expansion tests loss of review, shared-read and estimating-read duties after exact-revision hydration, with a second row providing actual lookahead. Original assertions and outcomes remain retained. [Exact source/test fingerprints and build identity](manifest.json) identify the final contribution.

| Check | Observed result |
|---|---|
| PostgreSQL source and register proof | All eight distinct cases pass; original exact-estimate/quotation preservation and source-refresh rollback/recovery remain covered |
| Focused units | 4/4 pass: strict register query and native pricing/validation |
| Compiled authenticated HTTP | 4/4 pass: both new register cases and both original source/estimate-refresh journeys |
| Static/build | Full build, TypeScript and full lint pass; final changed-test TypeScript and focused lint pass |
| Repository assurance | Foundation, PP-01 prototype and naming pass; 78 parent requirements retained |
| Live design register | Pass: 358 entries, 43 components, 330 unreviewed entries and 28 stale reviews. All original review fingerprints retained |

New database proof covers native Draft/Submitted/Reviewed/Returned/Rejected facts, owner and reviewer views, zero-cost and minimum-seven first tiers, exact old-revision retention after a successor, unknown/past/today expiry, literal `%_` and injection-like search, explicit company narrowing, site-only/expired/inactive authority, all-match counts across 101 sources and bounded pages, revoked access during hydration, and unchanged audit/receipt/source-event/estimate-version counts after reads. HTTP proves the same endpoint through compiled Next handlers with no-store, original DTO compatibility, native submit/review and exact replay, foreign-company exclusion, 401/403/405/422 responses and denied payloads without source evidence.

The initial naming check failed because an extra source pointer took the copy-ready project instructions above 8,000 characters. The redundant pointer was removed; that file remains unchanged and its existing Backend link reaches this contract through the updated plan. Naming then passes at 7,995 characters. No application test failure, assertion weakening or deadline extension occurred.

The task owns an isolated PostgreSQL 16.15 cluster and `ppo_synthetic_test` database; configuration, credentials, generated documents and raw logs are outside Git. Node 24.21.0 and npm 11.19.0 use the unchanged lockfile. The first cluster launch waited on the server process tree and was interrupted; one subsequent connection attempt was refused before a detached hidden launch corrected setup. No test had executed yet and no existing application database was reset. The compiled listener returned 200 on `/login` before HTTP execution.

## Reproduction

Use private local-synthetic configuration for a disposable database named `ppo_synthetic_test`, the repository lock capacity and reviewed Chrome renderer. Run database files serially and wait for the compiled server's listener before HTTP execution.

```text
node --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/estimating-sources.test.ts
node --import tsx --test --test-concurrency=1 tests/unit/cost-source-register.test.ts tests/unit/estimating-sources.test.ts
npm run typecheck
npm run lint
npm run build
node --import tsx scripts/local-server.ts --compiled
node --import tsx --test --test-concurrency=1 tests/http/estimating-sources.test.ts
python scripts/check_foundation.py
python scripts/check_prototype.py
python scripts/check_naming.py
npm run studio:check
```

## Limits

This is an additive backend read, with the original list/detail contracts and source/estimate commands retained. No page, shared component, migration, seed, grant, dependency or provider change is made. Functional proof does not establish Figma parity, owner/device/business acceptance, production capacity or deployment. Full unrelated database/unit suites and fresh browser/visual/restart proofs are not claimed; PR CI is separate. Existing draft/stale visual reviews remain visible.
