# PJ-07 readiness API execution evidence

Owner: Codex. Branch: `codex/project-readiness-api`; [claim PR #948](https://github.com/deanrfiedler-gif/powerplants-one/pull/948). Baseline: `bdcdd347fcb29c3806cd23d1e85be03f972b6628`. [Contract](../../../contracts/project-delivery-readiness.md) and [decision](../../../decisions/project-readiness-api.md). Executed on 13 November 2026 against synthetic local fixtures. The [source manifest](source-manifest.json) binds the production/test bytes and retained focused logs; Git records the containing commit.

## Setup and initial checks

The required `scripts/cloud-setup.sh` completed with pinned Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15 on the disposable `ppo_synthetic_test` database. It reported browser unavailable. A direct `npm run browser:check` confirmed missing Chrome at `/opt/google/chrome/chrome`; this is not a browser/device or rendered-PDF proof. No operational data, hosted database or production adapter was used.

The first focused database run passed four cases and refused the source-change fixture because an Engineering blocker requires the native `Awaiting information` state. The fixture now uses that state. Inspection also found that its later Supply allocation command needed `expected_version: null` and `unit`; these were corrected before reaching that step. No production validation or deadline was relaxed. Self-checking also normalised PostgreSQL source timestamps before hashing and included native allocation versions; the successful round-trip hash assertion covers the exposed JSON basis.

## Executed checks

| Check | Actual result and boundary |
|---|---|
| `npm run check` | Passed: studio register, full ESLint, TypeScript, all **1,451** standard unit tests and production Next.js build. The existing draft/stale design registrations remain visible; this is no UI acceptance |
| Native database PJ07-01 through PJ07-05 | **5/5 passed, unmocked**, on the final production bytes. Covers native source revisions/owners, no business writes, Activity completion with blocker retained, usable allocation, changed material evidence, canonical JSON hash, exact Project isolation, company/source revocation, missing/partial evidence and the 50-item bound |
| Native database PJ07-07 | **1/1 passed, unmocked**, added after the five-case run. A SupplierConfirmed promise for the current demand-local day produces AtRisk; a corrected expired promise produces Blocked. Neither permits project release |
| Database PJ07-01 through PJ07-06 with explicit command-only renderer | **6/6 passed.** The existing specialist fixture creates a released quotation and requires a renderer. This separate run enabled the repository's existing test-only renderer; it proves native specialist acceptance, retained-source drift and revoked-source hiding, **not real PDF rendering**. The standard suite and application renderer are unchanged |
| Compiled HTTP PJ07-HTTP01 | **1/1 passed** against `npm run serve:compiled`: source identity/hash/counts, explicit non-release, protected response headers, repeated sources, cross-company 404 and invalid UUID/query refusal |
| Actual PostgreSQL restart | Passed: save through native commands, read and retain Project/source/summary values, restart the local `ppo-postgres` container, then use a new Node process and fresh principal to read again. Exact Project, source evidence/hashes and summary survived; `as_of` is intentionally a fresh observation. [Retained output](restart.txt) |
| Final lint and TypeScript | Passed after adding the date-sensitive Promise case; no production bytes changed after the full build |
| Documentation assurance | Foundation, prototype, naming, status-source and migration-registry checks; 44 documentation regression tests. Committed contribution scope checked separately at handover |

All database runs use the unchanged 120,000 ms per-test deadline. No broad application DB, browser, upgrade or device suite is claimed from these focused runs. No migration, seed, capability or grant changes were made.

## Reproduction and retained evidence

After successful `scripts/cloud-setup.sh`, source its emitted `.ppo-tools/env.sh` in each shell. Use only disposable `ppo_synthetic_test`; the fixture suites reset it. The focused commands are:

```sh
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='PJ07-0[1-5]' tests/database/project-readiness.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='PJ07-07' tests/database/project-readiness.test.ts
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --experimental-test-module-mocks --env-file=.env.local --import tsx --import ./tests/helpers/project-claims-synthetic-renderer.mjs --test --test-concurrency=1 --test-timeout=120000 tests/database/project-readiness.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/http/project-readiness.test.ts
```

The six-case command-only run preceded addition of PJ07-07; the same command now selects seven cases. Its retained log is six, not seven. The HTTP command requires the compiled local server. [Native five-case log](database-native.txt), [Promise log](database-promise.txt), [command-only log](database-command-only.txt) and [compiled HTTP log](http.txt) retain the actual outcomes. Full setup/check logs remain in the task workspace, outside Git; their hashes are recorded. They contain no production evidence.

## Publication, review and remaining acceptance

The implementation and this evidence were prepared locally while PR #948 remained claim-only. The latest inspected heads of #905 (`1289b9238`), #932 (`554214c9f`) and #945 (`9e634df7c`) still had queued/running CI. Products #947 also received implementation during this session. The [three-build limit](../../../../CONTRIBUTING.md#working-in-parallel) therefore remains relevant before pushing this implementation. No earlier-head check is presented as verification of this contribution.

After a build slot is available or Dean explicitly permits an exception, fetch/merge current main, run checks affected by any integration, push the implementation and mark the completed PR ready for full CI. The required one independent Claude review has not happened; no Claude reviewer is callable in this session. Its focus is native source authority, hidden evidence/counts, stale specialist/material bases, date-sensitive promises and the non-release boundary. Full CI with the real renderer, owner acceptance and complete PJ-07 scope remain separate. Nothing is merged or deployed.
