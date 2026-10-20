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
