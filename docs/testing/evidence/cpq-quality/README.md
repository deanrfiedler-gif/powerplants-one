# CPQ release quality execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 15 October 2026. Scope BC-04 / ES-02 / ES-03; EST-01–EST-09 preserved. Synthetic implementation verification; operational and visual acceptance remain separate.

## Source and decision

Isolated `codex/cpq-release-quality` continues PR #492. The decision was committed as `98f1bad` before implementation. Current main `cfd465f` includes #490/#491 merged externally. Existing worktrees and open PR #493 were inspected and preserved. PR #492's report CI repair `28da8c4` is integrated by ancestry; its independent automated review is clean, with CI tracked separately. No merge or deployment is performed.

The version-1 quality workflow reuses immutable accepted audit events, release command versions, shared operation receipts/outbox, current duties and bounded calculation workers. Definition schemas 1–4 and previous hashes remain intact. The [live amended schema](live-schema.json) records actual append-only guards and receipt constraints. There is no migration, seed, dependency or new capability. Enrollment is deliberate and inherited by future revisions of the same release root; legacy roots remain on their existing contract.

## Local execution

The final compiled application uses committed source `e403d87`, runtime `9d1f83f` and build `bib_Z2693MBCGXkLdrmle`. The [source manifest](source-manifest.json) binds 78 source/test/workflow files to their committed LF Git blobs and verifies normalized working bytes. Environment: Node 24.21.0, npm 11.19.0, PostgreSQL 16, Playwright 1.63.0 and stable Chrome 155.0.8059.80. All database work used the task-owned disposable `ppo_synthetic_test` instance.

| Check | Actual result |
|---|---|
| CPQ units | 44 passed, including six quality cases for exact candidate hashes, baseline regression, expected-negative fixtures, coverage/conflicts, limits and incompatible saved inputs |
| Serial PostgreSQL regression | 28 passed in one execution: all nine new quality scenarios and 19 existing CPQ cases. Includes company/access isolation, current source publication, native units, manual-line/quotation privacy, enrollment inheritance, independent/rejected/superseded reviews, exact native rule members, changed cost/Product sources, atomic rollback, concurrent/repeated commands, preserved history and populated upgrade/reseed stability |
| Strengthened concurrent refusal | Targeted case passed again with exact `VersionConflict` assertion; no runtime change |
| Compiled direct HTTP | Six passed in five sequential suites: quality (1), existing CPQ (1), published Products (1), governed costs (1), rebase (2). Exact accepted receipts/replays, changed-payload conflict, stale report refusal, independent duties, origin protection, current authority and private historical reads verified |
| Actual application/PostgreSQL restart | [Passed](restart.json). Different application processes and PostgreSQL postmaster timestamps; exact historical report, three original receipts and retained native/audit/outbox graph unchanged, with no duplicate effects. Intermediate API cases changed the company activation; accepted historical recovery still succeeded |
| Compiled browser regression | Two existing CPQ journeys passed: desktop and phone. The full 791-route warm-up also passed with zero unreachable routes; no new quality UI or visual approval is claimed |
| Application build/type check and full lint | Passed |
| Foundation, naming and design-register assurance | Passed. Existing design register still has 334 unreviewed and 28 stale entries; these checks confer no visual acceptance |

The complete 25-estimate report measured 150,165 bytes and 2,518 ms in the serial local run; the 26th estimate refused the whole assessment without enrolling a partial report. This is one synthetic measurement, not an operational service target. The runtime limits remain 25 estimates, 2 MiB input/report and the existing five-second worker budget.

Initial unsuccessful fixture executions were corrected to the existing contracts: schema-2 manual-line input, second-company identity, SQL UNION ordering, a genuinely changed cost-source successor and the Product evidence field name. The capacity fixture was rerun without a concurrent application build. Self-review caught incompatible old inputs and a fixture-replay hash computed against a modified definition; both were corrected with focused assertions before the final runtime commit. Test deadlines and authority checks were not relaxed.

Private raw logs and session-bearing checkpoints are excluded from committed/uploaded evidence. The safe restart summary contains hashes, process/timestamp evidence and outcome counts only. No operational data was used.

## CI and independent review

[PR #494](https://github.com/deanrfiedler-gif/powerplants-one/pull/494) is stacked on [PR #492](https://github.com/deanrfiedler-gif/powerplants-one/pull/492). Independent automated review found a CI artifact-name collision after adding the quality lane; `8748d9a` fixes it while preserving the existing browser/database names. The [replacement review](https://github.com/deanrfiedler-gif/powerplants-one/pull/494#issuecomment-6179202357) reports no major issues at `8748d9a`. Later source changes only strengthen two test assertions and record execution evidence. Final-head CI/review remain separate live PR gates; this local record does not declare them complete or confer human approval.

The inherited #492 report restart correction now passes its [replacement CI reports job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38639344397/job/116110584194); the earlier failure was reproduced on unmodified main before that harness correction. Its remaining CI is tracked separately.

## Remaining acceptance

No native UI/Figma or operational acceptance is claimed. Separately owned rule/table/book packages, approved fixture families and representative workload targets remain open. Report limits are 25 open estimates and 2 MiB each for input/evidence under the existing worker deadline, not enterprise capacity claims. Existing AUD, native unit, source authority, explicit rebase/adoption and customer-safe quotation contracts remain in force.
