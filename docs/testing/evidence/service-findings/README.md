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

## Final R2 runtime checkpoint and compiled CI repair

Head `6926accc94de9cf8a110fcef4784722bf3dbf314` passed [Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39356046740): all four database shards, HTTP, Reports, desktop/mobile browser, restart and performance groups completed successfully. Its logs explicitly record all four final R2 source scenarios, the populated 0109-to-0111 upgrade, both findings HTTP boundaries and the real HTTP next-action save/retry. Final-source TypeScript and targeted ESLint also passed locally. The earlier local setup timeouts remain incomplete attempts, not regressions or passes. [Selected exact-source CI log evidence](r2-ci-checkpoint.json).

The sole red aggregate came from the separate compiled desktop job, cancelled at its unchanged 60-minute job limit after reaching case 515. Before cancellation it reported 493 desktop passes and 21 retained skips; no assertion failure is reported. Mobile and retained compiled groups passed. The cancellation and failed aggregate are retained in the same checkpoint; this is not a passing full compiled workflow.

The repair merges main `5ebb5c0a` and regenerates the conflicted STATUS file. It partitions the existing desktop project into native Playwright shards `1/2` and `2/2`, each with its own build/server/database. Mobile remains complete through `1/1`; retained proofs, serial workers, individual/job deadlines, assertions and the mandatory aggregate stay intact. The [decision](../../../decisions/ci-compiled-browser-suite.md#20-october-2026--partition-the-compiled-desktop-project) records alternatives and limits.

Actual Playwright discovery on the integrated tree contains 524 desktop cases including warm-up. The two shards discover 263 and 262: their union is exactly 524, with no missing/extra cases and only one duplicated warm-up. Mobile `1/1` is identical to its original 524-case selection. Complete parsed-workflow comparison permits only the declared partition/env/command/artifact changes. All embedded Bash syntax passes, and the unchanged aggregate rejects failed, cancelled, skipped and missing results. [Selection and configuration proof](r2-desktop-shard-validation.json). This does not execute the browser tests; the repaired CI run must finish both shards and the aggregate.

The independent GPT-6.1-Sol reviewer inspected the workflow and installed Playwright grouping implementation and found no concrete defects in coverage, serial-group preservation, warm-up, isolation, artifact uniqueness or aggregate semantics. It made no edits and did not run heavy tests or use the database. Final repaired-head CI remains separate from this review and from business acceptance.

## Split CI result and migration integration — 21 October 2026

The repaired head `70260676cd020ea173d57deab4c6f439bd141426` completed all 22 workflows successfully, including [Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39396941966), [Compiled application browser assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39396941868) and the merged-tree check. The [exact-head workflow checkpoint](r2-split-ci-success.json) records those results.

Subsequent main `4c1097cc` adds migration 0113. PR #634 integrates it alongside reserved 0111, retaining both exact migration histories, the historical Products cases and both demo-upgrade reviews. The combined demo count is 94 additions after migration 0017. Generated status is rebuilt from all fragments. The R2 upgrade suite now also covers installing 0111 after an existing 0113 history while retaining original ledger entries and source/Activity data. The previous successful CI is evidence for `70260676`; the combined head requires its own CI result.

Both combined-history upgrade cases passed locally: populated 0109 to 0111/0113, and reserved 0111 installed after populated 0113. The [raw upgrade result](r2-merged-upgrades.tap) records exact data/ledger preservation, idempotent migration/seeding and accepted pre-upgrade receipt recovery. Command: `node --env-file=.env.local --import tsx --test --test-reporter=tap --test-concurrency=1 --test-timeout=180000 tests/database/service-finding-next-action-upgrade.test.ts`. The two focused R2 parser tests, targeted ESLint, naming, migration numbering, generated status and whitespace checks passed. An earlier broader local run passed its first Discovery scenario but hit the 120-second deadline in its second; it was stopped and is not counted as a passing full database run or attributed to this merge.

Independent GPT-6.1-Sol review found no defects in the resolution after inspecting 83 migration lists, computed histories, Products starting points, seed preservation, the demo count, late-0111 proof and incoming Reports integration. A separate mechanical comparison confirmed additive preservation of main's assertions in all 59 changed existing test files. The reviewer made no edits and ran no database tests; review and focused local proof do not replace combined-head CI.

## SV-07 native page — 31 October 2026

Contribution: `codex/service-findings-ui`, [PR #801](https://github.com/deanrfiedler-gif/powerplants-one/pull/801), starting main `1402c87b9069def4dcd4d82f291cd991cff40ca5`. Owner: Codex for this implementation; Dean Fiedler remains the product owner. The dedicated worktree uses real `npm ci` with Node 24.22.2/npm 11.19.0; no engine override, junction, dependency, migration, capability or grant was added. The isolated loopback server uses port 3147 and PostgreSQL 16 uses port 5547/database `ppo_synthetic_test`. All fixture data is synthetic.

### Functional proof

Five focused unit tests and five mocked-browser scenarios pass. They cover strict filters/identities, source-owned closure, the inclusive 90-day boundary, due-week and overdue boundaries in site time, all eight views and all five sources, next-action history and unchanged-operation replay, stale-version comparison, technician view-only controls, failed-read clearing and continuation through an empty selected-view window. Two native HTTP tests pass, including all eight view names, authentication, private/no-store responses, strict input/origin checks and unavailable source refusals. The native recurrence database test passes: original check identity, repeated failures on one open defect, exact 90-day inclusion and 1 ms exclusion, no source-state mutation, and Activity-read revocation. Historical observations are seeded through the inspection engine so the test does not pretend today’s attendance can capture an old reading.

The native recurrence run used a 600-second local test deadline and took 149 seconds in its test body under memory contention. An earlier unchanged native inspection test exceeded the standard 120-second deadline. The same test on an untouched archive of main `1402c87b` also exceeded 120 seconds. The full affected native suites are being rerun with the longer local deadline, without changing assertions or repository/CI time limits. Results of those suites, final typecheck and lint are pending here until execution finishes.

Foundation, naming, `studio:check`, and status-source validation passed. The register retains pending/stale visual reviews; no acceptance fingerprint is copied. Full build, the complete repository test suite, owner acceptance and deployment are not claimed.

### Visual comparison

Codex inspected the application’s register and selected remaining-work finding at 1440, 1024, 390 and 320 px against retained accepted captures 01, 02, 05, 06, 07 and 08. Phone evidence includes top, middle and bottom scroll positions. The 1024 capture collapses the primary rail using its existing control. Retained source images are unchanged. This is an implementation review, **not visual acceptance**.

Differences are recorded in the [page contract](../../../design/development/pages/scope-sv-07.md#differences-and-open-work): native source references and real read fields; bounded counts/read-time qualification and pagination; horizontal ten-column scrolling; shared shell/header/date controls and fallback icons; native required change reason; source history linked rather than fabricated; no category recurrence where the source has no stable fault key; no SV-08 controls; no bulk assignment; no 30-day cutoff; Ready to close qualified as follow-up completed awaiting source review. Layout spacing and wrapping differ where these controls and truthful text require it. Owner/device acceptance remains pending.

### Service reports regression boundary

Only three additions touch `report-register.tsx`: the Findings menu import, the Service reports group heading and the Findings/History groups. Its data, table, snapshot and actions are unchanged. The new menu stylesheet targets only the new menu class. Report record components, their styles and native commands have no diff. The existing Service reports browser suite passed seven of eight tests; the phone Details handover URL assertion failed. The identical assertion fails on untouched main `1402c87b` at port 3148 with the same unchanged URL and five-second expectation. That baseline failure is retained; this PR does not alter the report handover.

### Separate delivery statuses

Functional proof: focused passes above; remaining native/static checks pending. Visual review: inspected comparison with declared differences; no visual acceptance. Owner acceptance: pending. Deployment: not performed. Claude’s exact-head review and all CONTRIBUTING merge gates remain required.
