# Customer 360 workspace read evidence

[PR #863](https://github.com/deanrfiedler-gif/powerplants-one/pull/863), branch `codex/customer-360-read`, starts from main `9c956b1b93c2cfed9e3aa1237927b537f8dc3d88`. [Claude’s measured bottleneck](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6659628859) identifies the repeated native context and permission reads. Implementation choices are Codex decisions under the standing order. No PR merge, deployment or owner acceptance is claimed.

## Design and equivalence

`src/shared/customer-360.ts` retains the candidate queries, first-100 windows, source gates, source-error projections and DTO assembly. Independent sections, candidates and per-estimate quote lists share lookup waves through `src/activities/page-reads.ts`. Every reader drains before the original section, item and error order is restored. The native estimate, quote, Project, work-order and Finance readers still decide what is visible. The adapter limits each SQL statement to 100 parameter sets and separates rows returned to duplicate consumers so native estimate annotations cannot affect another quote’s historical version.

`src/platform/permissions.ts` reuses only its exact existing permission query within the page. Parameters include workspace, actor, capability, company and Site. Every other SELECT still runs; the final organisation read uses the raw client. `src/shared/reads.ts` and `src/finance/accounts.ts` only add an optional internal query client; existing callers retain the original path.

`tests/helpers/customer-360-per-row.ts` is main’s unoptimised workspace function with import paths and its exported function name adjusted. Its body remains byte-equivalent to the original after those two transformations; current main’s reader is also unchanged. [Contribution accounting](contribution.json) retains the source hash and merge evidence.

`tests/database/customer-360-reads.test.ts` compares the complete DTO by deep equality and `JSON.stringify` equality with a fixed observation clock. Four principals cover broad access, one-site access, expired quotation/Project access and another company. The proof also checks revoked grants, a selected working company, the original 403/404 refusals and mixed visible/hidden deals, estimates, quotations, Projects, work orders and Activities. A second test creates 101 candidate chains and 100 additional revisions of the first estimate: the result retains 100 deals, 100 Projects, 100 estimates, 199 quotations and 100 Activities with the exact original continuation. The signed cursor itself is included in the unmodified JSON comparison.

`tests/helpers/customer-360-fixture.ts` creates synthetic native records and dedicated test principals. Independent fixture chains run four at a time and drain before the next group. No existing expectation or timeout changes.

`tests/unit/customer-page-permissions.test.ts` checks the full permission key, request lifetime and separate native row annotations. The added case in `tests/unit/proof-request-scope.test.ts` exhausts the ordinary cap, then proves late workspace events survive while unrelated events remain suppressed and raw IDs are absent.

## Same-data compiled measurements — 6 November 2026

[Machine-readable results](measurements.json) retain timestamps, phase counts, matching DTO hashes, final source hashes and the main comparison SHA `b6ee136c353bc66b5012d39908a61a95cece29de`. Environment: Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15 in `ppo_synthetic_test`.

The representative fixture is the normal seed plus `customer360Fixture(40)`, with one native Draft quotation per estimate. The larger fixture is the final equality test’s 101 chains plus 100 additional revisions of its first estimate. Each before/after pair reads unchanged synthetic business data. Establish coordinator sessions outside the measured interval and warm each compiled route once. Pin both application servers and PostgreSQL to CPU 0, enable `log_min_duration_statement=0`, and call `GET /api/v1/customers/50000000-0000-4000-8000-000000000001/workspace` serially on main and the branch. Sum PostgreSQL parse, bind, execute and simple-statement durations timestamped inside each GET, excluding measurement-control SQL. Count execute plus simple statements once; parse/bind log entries are separate. Restore logging and the original effective CPU affinity afterwards. This follows [Claude’s compiled-server, single-core, database-log method](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6652225470).

| Fixture | Executed statements, before → after | Summed database duration, before → after | Workspace wall time, before → after |
| --- | ---: | ---: | ---: |
| 40 native chains | 1,627 → 85 | 881.969 → 1,052.922 ms | 2,108.193 → 979.687 ms |
| Candidate/revision limits | 5,530 → 96 | 4,685.485 → 6,240.492 ms | 10,204.571 → 4,591.567 ms |

The representative sample reduces statements by 94.8% and wall time by 53.5%. Summed database duration increased in both samples. Concurrent query intervals can overlap and exceed request wall time; this is elapsed database duration, not a CPU measurement. These are single warmed local samples with SQL logging, not hosted-load or whole-application targets.

Compiled responses match after removing observation timestamps and comparing decoded continuation bodies: separate compiled processes have separate random cursor-signing keys. The database proof above compares the complete original DTO and JSON, including the exact signed cursor, in one process.

## Validation

Cloud setup completed: PostgreSQL ready; browser unavailable. The final `npm run check` passed Studio integrity, lint, typecheck, all **1,420 unit tests** and the production build. The final two-test Customer 360 equivalence run passed, as did all **14 existing Customer 360 database cases** in `tests/database/customer-location.test.ts` and `tests/database/organisation-register.test.ts`. The two Activity equivalence tests also passed.

The selected database regression run passed **159 of 205** cases, with no skipped or cancelled tests. All 46 failed cases also failed on clean main. After the isolated rerun of one initially timed-out Finance case, 45 are **environment-blocked: browser** (`RenderOrStorageFailure` or `ExactDraftUnavailable`); the same-name Finance fixture’s `assignment_id` error is **pre-existing on main in this environment**. The additional `tests/database/sales-workflows.test.ts` run passed six of eight cases; both CR05 rendering failures reproduced on main. [Every test, message, comparison and final affected rerun](database-results.json) is recorded.

One large equality run timed out while the full check ran concurrently and the measurement’s one-CPU restriction remained on PostgreSQL. Docker had ignored an empty CPU-set restore value. The harness now explicitly restores effective CPUs `0-4`, and the database proof runs serially. The unchanged new test passed against clean main with its identical test/fixture files, and the final branch’s complete two-test proof passed. No assertion or 120,000 ms deadline changed. This resolved verification-harness issue is retained in the database record.

The HTTP shared group passed **92 of 115** tests. All 23 failures reproduced on main’s compiled server after a fresh reset, with matching messages apart from ephemeral correlation IDs: 15 are **environment-blocked: browser**, and eight are **pre-existing on main in this environment**. [The HTTP record](http-results.json) names each case and the missing restart-fixture errors. The unchanged runner exits before its 33 exclusive files. Those files and all local browser suites are **not run here; left to GitHub CI**.

No HTTP or browser fixture changed. Existing HTTP tests that call `reset()` remain in the exclusive set. The final repository-path audit found all 10,155 literal paths in register, guide, module-integration and this PR’s JSON evidence records. Foundation, prototype, naming, status-source, migration and Studio checks passed, as did all 44 documentation unit tests. Ready-head compiled/P01–P11 browser results belong in the PR handover. Claude’s one independent review is requested there; no review acceptance is inferred from these checks.

## Main integration

Main `b6ee136c353bc66b5012d39908a61a95cece29de` merged without conflicts in merge-only commit `b2548eb91f949f231b284988b8d5fd5a51bac554`. Stable patch IDs before and after that merge match exactly: `82e4e1de69ad35f0012bdcdd7c4ab5dddc4c54dc`. Guides are **main’s count + 0 (367)** and the register is **main’s count + 0 (393)**; both retain main’s exact bytes. No whitespace-only entry edits were carried. Later changes to this PR’s own source and evidence are separate from that merge-only accounting.
