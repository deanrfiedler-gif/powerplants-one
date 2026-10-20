# Service findings backend execution evidence

Owner: Dean Fiedler. Contribution: `codex/bc06-service-findings`, [PR #623](https://github.com/deanrfiedler-gif/powerplants-one/pull/623), starting main `d512bd38`. [Contract](../../../contracts/service-findings.md), [decision](../../../decisions/service-findings-backend.md).

## Environment and execution

Node 24.22.0, npm 11.19.0, PostgreSQL 16 in a dedicated loopback cluster, named disposable database `ppo_synthetic_test`, and a separate private synthetic document directory. Other agents' databases and worktrees are not used. Reviewed Chrome 155.0.8059.85 is available; no hosted deployment or external integration is part of this proof.

## Results and retained corrections

- Three focused unit tests passed: strict query/key parsing, Activity completion versus source closure, and exact deadline boundaries.
- The six targeted database scenarios passed after the bounded-window change. They cover native scheduling, source and Activity permission revocation, working-company isolation, inspection correction, immutable incomplete report revisions, customer-response correction and incident action privacy. The initial run passed five and failed one scheduling assertion: it expected the entire open register to be empty after closing one appointment's follow-up, overlooking a seeded follow-up. The corrected assertion filters the exact appointment; the subsequent six-test run passed.
- All three final affected database tests passed again with the expanded assertions: distinct pages, an empty selected-view page retaining continuation, exact displayed inspection/report reference search, accepted passing-retest closure and required NotTested findings. These are additional assertions in the existing scenarios, not three new test cases.
- The HTTP test passed against the dedicated local server: authenticated private/no-store reads, bounded queries, invalid/unknown fields, unavailable versus malformed identities, other-workspace isolation, unauthenticated refusal and unsupported-write refusal.
- Final-source TypeScript and targeted ESLint passed with the expanded tests. ESLint was invoked directly through the installed executable after its npm wrapper stalled; no dependency change was made.
- Foundation assurance and the development-register check passed. Naming assurance initially identified missing Git-master metadata on the two newly registered documents; both were corrected and naming passed. Existing pending/stale visual reviews remain visible.
- The local application build compiled successfully, then was stopped during its separate TypeScript phase because of local resource contention. This is an interrupted build, not a full build pass. Full application/CI results belong to the exact PR head.

Retained raw results: [six database scenarios](database.tap), [three final regression reruns](regression.tap), [HTTP boundary](http.tap). Database commands used `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=180000 tests/database/service-findings.test.ts`; the final rerun selected the scheduling, inspection and remaining-work cases. HTTP ran `tests/http/service-findings.test.ts` against the dedicated server on port 3149.

Local timing is an observation, not load acceptance: the first HTTP list took 5.2 seconds in application code during local contention. An isolated candidate-query EXPLAIN reported 55.8 ms planning and 66.0 ms execution with no JIT. Two subsequent full-reader calls measured 8.7 seconds and 1.0 second respectively. No database-setting or product performance claim follows from these variable local results; compiled/load verification remains separate.

The initial draft claim `9dbb7e14` failed documentation and merged-tree checks because its generated STATUS update was omitted. The correction integrates main `971ac350` and regenerates from both contributors' fragments; both checks passed on `11d3835a`. These checks cover the corrected claim, not the later application implementation.

## Independent review

A separate GPT-6.1-Sol reviewer inspected the implementation against the native authority/lifecycle helpers. It identified (1) unbounded per-history hydration under the workspace lock and (2) SQL search missing the exact rendered reference and derived NotTested text. Both were fixed. The reviewer rechecked the bounded authority admission, native publication checks, search and test changes and found no remaining concrete defects. It made no edits and did not execute the database tests. Automated independent review is separate from Dean's approval.

The database suite uses native creation and handover for all five source families. Reads preserve audit/receipt/outbox counts and native Activity/appointment fingerprints. No production integration, UI implementation, owner/device review, deployment or full BC-06 completion is claimed.

## R2 next action — 20 October 2026

Contribution: `codex/bc06-findings-next-action`, [PR #634](https://github.com/deanrfiedler-gif/powerplants-one/pull/634), from main `8f5ad31b`, integrated with `0ebb26a3`. The same dedicated synthetic environment was reused. Migration 0111 adds two empty binding/evidence tables and no seeds, grants or users. Existing source rows remain native authority.

- Five unit scenarios passed across the R1 parser/model and R2 strict command parser.
- Before the compatibility correction below, four R2 database scenarios passed, covering all five source families: one task retained/created, exact and competing retries, stale source/Activity versions, native owner eligibility, technician refusal, working-company scope, current receipt authority, before/after history, source byte preservation, terminal refusal and atomic rollback after a simulated storage failure. The deadline case checks matching overdue flags.
- The initial populated 0109-to-0111 upgrade passed: existing Activities, links, appointments, sources, grants, users, audit/operation/outbox rows and seed receipts remain identical. The exact old migration ledger survives, only 0111 is added, repeated migrate/seed changes nothing, and an accepted pre-upgrade generic Activity edit remains recoverable. Final compatibility assertions retain the native coordinator's edit metadata until an R2 binding exists.
- TypeScript and targeted ESLint passed before the compatibility correction. Naming initially failed because the maintained project instructions exceeded their 8,000-character ceiling; the addition was compressed and naming passed at 7,987 characters. Foundation and development-register checks also passed. Final runtime checks are recorded below when complete.

The retained [source cases and initial upgrade attempt](r2-sources-and-initial-upgrade.tap) includes four passing source cases and one failed upgrade setup: the first setup left `ppo_proof` behind. The corrected [populated upgrade rerun](r2-upgrade.tap) passes. An earlier missing-task inspection fixture also omitted the mandatory defect-version increment; that fixture was corrected before the retained passing source run. These setup failures were corrected in the test, not bypassed in application code. [Unit results](r2-unit.txt) retain the five passing scenarios.

CI at `075f05eb` exposed a compatibility regression in the generic-update guard: both Reports browser viewports expected the existing coordinator to update the original response follow-up after a correction. The revised guard preserves that native workflow with scoped Service and all-source actor/owner authority, while any R2 binding requires the source-token editor. Regression assertions cover native coordinator editing, native technician refusal, native proposed-owner refusal, and redirection after R2 adoption. Local My Work setup and a seed retry timed out before reaching their test bodies; neither is counted as a passing regression run.

Independent review used `gpt-6.1-sol` through the repository's second-model workflow. It found two defects: the next-action read initially defaulted overdue to false, and generic Activity updates could bypass source authority. Both were fixed with regression assertions. After the CI compatibility correction, the reviewer rechecked raw membership across all five native sources, binding precedence, actor/proposed-owner checks across every source, pre-0111 behaviour, guards after receipt recovery, matching My Work edit metadata and unchanged owner execution. It reported no remaining findings and confirmed `git diff --check`; it made no edits and ran no database tests. This is independent automated review, not Dean's approval.
