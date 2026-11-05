# Customer 360 workspace read evidence

[PR #863](https://github.com/deanrfiedler-gif/powerplants-one/pull/863), branch `codex/customer-360-read`, starts from main `9c956b1b93c2cfed9e3aa1237927b537f8dc3d88`. [Claude’s measured bottleneck](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6659628859) identifies the repeated native context and permission reads. Implementation choices are Codex decisions under the standing order. No merge, deployment or owner acceptance is claimed.

## Design and equivalence

`src/shared/customer-360.ts` retains the candidate queries, first-100 windows, source gates, source-error projections and DTO assembly. Independent candidates and per-estimate quote lists run in ordered, drained batches through `src/activities/page-reads.ts`. The native estimate, quote, Project, work-order and Finance readers still decide what is visible. The adapter limits each SQL statement to 100 parameter sets and separates rows returned to duplicate consumers so native estimate annotations cannot affect another quote’s historical version.

`src/platform/permissions.ts` reuses only its exact existing permission query within the page. Parameters include workspace, actor, capability, company and Site. Every other SELECT still runs; the final organisation read uses the raw client. `src/shared/reads.ts` and `src/finance/accounts.ts` only add an optional internal query client; existing callers retain the original path.

`tests/helpers/customer-360-per-row.ts` is main’s unoptimised workspace function with import paths and its exported function name adjusted. `tests/database/customer-360-reads.test.ts` compares deep equality and `JSON.stringify` equality with a fixed observation clock. It explicitly checks different visibility, site grants, expiry, revocation and working company. `tests/helpers/customer-360-fixture.ts` creates synthetic native records and dedicated test principals. No existing expectation changes.

`tests/unit/customer-page-permissions.test.ts` checks the full permission key, request lifetime and separate native row annotations. The added case in `tests/unit/proof-request-scope.test.ts` exhausts the ordinary cap, then proves late workspace events survive while unrelated events remain suppressed and raw IDs are absent.

## Validation in progress

Cloud setup completed: PostgreSQL ready; browser unavailable. Local browser suites: **not run here; left to GitHub CI**. Full validation, same-data compiled measurements and ready-head CI are pending; this draft record does not report them as passed. Claude’s one review has not yet been requested.
