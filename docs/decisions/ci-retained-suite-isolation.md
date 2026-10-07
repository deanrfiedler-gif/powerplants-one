# Retained Application assurance isolation

**Decision:** 22 September 2026 · **Scope:** PR #272 assurance repair requested by Dean; synthetic CI only.

## Evidence and problem

Application run [35609271386](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35609271386), source `39d65283a295efc6bc9b9cc5314dd66eaf78df0d`, failed its first attempt on mobile Intake while permitted records were loading. The same assertion failed on unchanged main `af3f045` in run [35597947794](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35597947794). On the second attempt Intake passed, but CRM identity readiness, Email/Calendar identity controls and the Finance work-order form were still loading at their existing deadlines. Two subsequent Finance failures depended on the first case's missing reconciled fixture. Original artifacts and both attempts remain failed evidence.

The second attempt ended as **cancelled**, about 151 minutes after starting, with the full database suite still running after 61 minutes. Later generic persistence, HTTP and offline phases did not run. Five development-server warm-ups took 221–374 seconds each. These observations establish a serial budget problem and development-server readiness failures; they do not establish a memory leak or the cause of variable runner latency. The separate compiled run [35609271234](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35609271234) passed all 240 applicable browser cases, with 41 configured skips, on the same source.

## Decision and alternatives

Partition the existing primary job into four matrix lanes. Each gets its own runner and disposable `ppo_synthetic_test` service, with unchanged pinned dependencies. Preserve serial execution within each lane, every original command and all actual application/PostgreSQL/browser restarts:

| Lane | Retained phases |
|---|---|
| Browser | Mobile CRM database/browser, focused I2, CRM I1 restart, full desktop/mobile browser suite |
| Finance | Focused P10 browser, original claim/reconciliation restart, Finance database suites |
| Reports | Reset refusal guards, P09 submission/response restart, focused report browser |
| Database | Entire database suite, reset, generic persistence restart, startup refusal, HTTP and quality HTTP, offline restart |

The stable **P01–P11 and CRM I1–I2 local application and PostgreSQL proof** check depends on the whole matrix and fails unless every lane succeeds. Matrix fail-fast is disabled, each lane has a 90-minute limit, and evidence artifacts have distinct names. Existing four focused P11 jobs remain unchanged. No phase becomes optional and no passing retry is substituted for a failed test.

Use the existing `playwright.compiled.config.ts` for the five primary browser invocations. This supersedes the earlier [decision to retain the primary development-server browser step](ci-compiled-browser-suite.md) for this repair. Test selection, browser channel, viewports, assertions, deadlines and warm-up remain unchanged. The standalone compiled check remains. Development-mode coverage continues in the focused P11 jobs, other module workflows and the unchanged restart/HTTP launchers. The local launcher and its production/shared-startup refusal are unchanged.

Simply increasing the 150-minute limit would leave unrelated phases competing for one serial budget. Adding retries or extending page assertions would obscure readiness failures. New infrastructure, browser dependencies and application changes are unnecessary: the repository already has the compiled launcher and isolated PostgreSQL service pattern.

## Independent fixture correction

Unchanged main's MW-DB01 date-only validation case used `now + 60 minutes` as a start and today's end as its finish. After 23:00 Brisbane, start exceeds finish, so the earlier interval validation correctly reports `starts_at`, while the test expects `due_date_only`. Use one hour before that same finish to isolate the intended contradictory date-only appointment input at any execution time. Production validation and the asserted error field are unchanged.

## Verification and limits

Local verification on Node 24.21.0/npm 11.19.0: actionlint 1.7.12, TypeScript, full ESLint, foundation and naming checks pass. A command inventory comparison confirms all 103 original primary command lines remain after normalising the five compiled-config additions; the four focused P11 jobs match the parent. The original 23:39 input reproduces `starts_at`; the corrected input produces `due_date_only` at all 1,440 minutes. Ten focused My Work units pass. The full local unit run has 201 passes and four Windows failures in document storage, recovery paths and route separators; the same failures reproduce in the unchanged main test/source versions. Fresh Linux CI remains the full-unit proof.

Database and browser execution use CI's isolated services, avoiding the other local worktree's database. Current-source run IDs and final results belong in PR #272; this decision is not a claim that a pending run passed. Business acceptance and deployment remain separate.

## Follow-up: await the original My Work read

On `7d4234a`, all four focused P11 jobs, Finance, Reports and the standalone compiled suite pass. The primary browser suite passes 239 cases and fails the last phone My Work case after switching to Coordinator. Its original screenshot shows the identity loaded, while the overview still has `aria-busy=true`. Retained numeric diagnostics show request 29062 started at 19:59:05.981 UTC and remained pending until the test closed it 5,232 ms later. The other scoped reads complete within 189 ms, with the application process largely idle and over 13 GB of system memory free. The record does not establish why this particular read was slow; replacing development compilation alone does not eliminate this assertion race.

The phone test's `open()` helper now registers a listener before navigation, awaits the original overview GET's successful response and body completion, then runs the existing five-second rendered-state assertions. No response is retried, no data is substituted and neither the assertion nor overall test deadline changes. The last Coordinator transition deliberately holds the real overview response for six seconds to exercise this order on every run. The preceding unavailable-source checks and all permission, count, layout and navigation assertions remain.

Original failed evidence is retained in Application run `35646044941`, artifact `10661096608`. The screenshot, JSON result and allowlisted request/runtime events were reviewed. Fresh corrected-source CI must prove this follow-up; the failed checkpoint remains separate from its result.

## Focused quality cleanup headroom

On `c01dc5e`, both full compiled browser runs pass 240 cases with 41 configured skips. The delayed phone My Work case passes once in each (9,217 ms standalone; 9,053 ms primary). The separate **P11 focused integrated quality and access proof** job in run `35649420044` records success for every test, evidence upload and cleanup step, yet its conclusion is cancelled: it starts at 20:10:42 UTC and completes at 20:40:44, two seconds beyond its 30-minute limit. The selected journey, retained Finance and final quality phases report 3, 7 and 13 passes respectively. Its three cold development warm-ups take 275,329, 270,153 and 278,703 ms, totalling 13 minutes 44 seconds.

Give this focused job 35 minutes, retaining its development-server configuration, all commands and individual assertion/test deadlines. This is bounded headroom for the measured complete job and evidence cleanup; it is not a rerun policy or a changed performance acceptance limit. The primary four-lane isolation remains, and the other three focused jobs remain unchanged. The cancelled check is retained as such, despite its successful component steps; the next source must receive a successful check conclusion.

## Retained CRM job budget

On `a067f04`, focused quality and both full browser checks pass. CRM run `35652826121` starts its interaction job at 20:43:18 UTC and is cancelled at 21:08:52, against its 25-minute job limit. Its 54 database cases and 23 refinement browser cases pass; the retained I2 step is cancelled after five minutes, before its warm-up finishes, and the later application/PostgreSQL restart proof cannot run. The first browser warm-up alone takes 216,697 ms. No assertion failure is reported.

Give the CRM interaction job 40 minutes to cover its database, two cold browser phases, actual restart proof and retained evidence. All commands, test selections, server modes and individual deadlines remain. Its separate header/board check is unchanged. This addresses a measured incomplete job rather than relabelling the cancelled source as passed; fresh-source CI remains required.

## Consistent compiled behavioral module proof

Two unchanged-source E1 attempts on `a067f04` fail in different legacy development-browser cases: first a GET connection reset after identity restoration (12 other cases pass), then the initial identity still busy in the DR01 case (again 12 pass). Both attempts pass all 205 units, 55 database and five HTTP cases. Email/Calendar on the same source first times out awaiting its deliberately delayed initial identity GET; its phone counterpart passes, and the isolated unchanged-source retry passes. Earlier Engineering evidence also records a development-only saved-package loading timeout. These failures are retained; their underlying transport/latency causes are not asserted as established.

Use `playwright.compiled.config.ts` for the legacy E1, Email/Calendar, Engineering and two CRM interaction browser invocations, as for the primary behavioral suite. E1, Engineering and CRM already compile before those phases; Email/Calendar adds the existing `npm run build` before its browser phase. The full compiled suite has already passed these same cases on `c01dc5e` and `a067f04`. Test selection, identities, assertions, deadlines, original fixtures and all restart/HTTP commands are retained. The component-only CRM design configuration is unchanged. This supersedes retaining development mode for those module browser invocations above, while keeping the measured job headroom.

Cold/warm performance, original-failure diagnostics, the focused P11 quality job and the existing development restart/HTTP launchers retain development-mode coverage. Local `npm run dev`, identity guards, application code and dependencies are unchanged. This uses the existing compiled runner to separate behavior checks from development compilation; no test retry or widened assertion window is added. Fresh-source CI must complete all applicable checks.

## ES-08 reconciliation after ES-02 merge

Dean subsequently authorised repair and merge of all current PRs. ES-02 #272 passed all 21 checks on `aa8a670` and merged as `460cf0b`. ES-08 #273 retains that four-lane aggregate, compiled module invocations and measured 35/40-minute job headroom. Its prior compiled configuration for the three focused quality browser phases is preserved: all 23 cases completed in the existing ES-08 run, while the unchanged development diagnostics, performance and restart/HTTP launchers continue to exercise development startup. This supersedes retaining development mode for that focused quality job above; no case, assertion or individual deadline is removed.

The integrated phone proof retains the real six-second response delay and awaits that original response against ES-08's isolated My Work test origin. Its controlled observation instant remains confined to the existing disposable browser harness; manual fixtures, write/audit timestamps and ordinary application startup retain their clocks. MW-DB01 keeps main's corrected date-only validation input. There is no application, schema or dependency change in this reconciliation. Fresh combined-source CI and final results are recorded in PR #273.

## ES-05 full database suite budget

Application run [37112227931](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37112227931) on ES-05 head `69e0ffa` cancelled its database job after 90 minutes. The database step ran from 09:15:50 to 10:42:04 UTC and recorded 703 successful cases, no failed assertion and no completed suite summary. The last recorded case checks transactional rollback of work-order authorisation. Cancellation is incomplete proof, not a pass. Unchanged main `8c14233` completed its whole database job in 50m36s in run `37107349827`; earlier main-source evidence also records an 81m57s job. These observations establish variable suite duration, not an application performance regression or a proven cause for the runner difference.

Split only the full database phase into Node's existing native `--test-shard=1/2` and `--test-shard=2/2` selections. Each matrix lane owns a separate disposable PostgreSQL service and still runs its selected files serially with `--test-concurrency=1` and the original 120,000 ms test deadline. Every discovered database file belongs to exactly one shard; no maintained filename allowlist can silently omit a new file. Local `npm run test:db` continues to select the entire suite. Both database shards are mandatory in the existing aggregate check, fail-fast stays disabled, and the 90-minute job limit stays unchanged. The existing browser, Finance, reports and separate HTTP/restart lanes and all their commands remain.

Alternatives considered: increasing the serial job limit retains the growing shared budget; concurrent files against one schema would invalidate resets and upgrade proofs; filename lists risk omissions. Native sharding uses the pinned Node runtime and existing isolated-service architecture without dependencies, retries, skipped cases, relaxed assertions or a new application concept. Fresh CI must finish both shards; the cancelled original remains recorded.

## ES-05 retained Sales review readiness

The same run's primary browser lane passes 549 cases, retains 79 configured skips and fails the desktop CR05 journey at its initial Customer review tab assertion. The original error context still says Loading aftercare review, whereas the subsequent failure screenshot already shows the saved review and tab. The phone counterpart and the separate compiled suite pass. The failure does not establish a quotation regression.

The Sales test and the two relevant application components are identical on `69e0ffa` and current main `48b2abd`, including earlier main `8c14233`. A compiled `8c14233` control passes the unmodified desktop journey. Holding that journey's real initial review response for six seconds reproduces the exact five-second tab assertion failure without changing application code or response content.

The retained journey now observes the original GET for its exact review ID before navigation, verifies status, body completion and record identity, then performs the original rendered-state assertions. Both desktop and phone deliberately delay that real response for six seconds to exercise the ordering. The response is not retried, fabricated or replaced; all later review, correction, commercial preparation, closure, permission and responsive checks remain. No production component, assertion deadline, test deadline or retry policy changes. Original failed evidence remains in artifact `11271134363`; fresh complete CI remains required.

## ES-07 owned Receipt correction proof budget

PR #346 head `1c0160b86b71440e9d67d30713cf89760ed9cac5`, [Supply database job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37252788053/job/111583662452), reached its unchanged 25-minute job limit. Eight of nine new Receipt cases passed, the competing-referral case failed, and the final retained Supply case had not completed when the job was cancelled. This is failed/incomplete proof; the failed case is repaired separately. The nine new cases consumed over ten minutes before the original 22-case group. Earlier head `b2e46c9` required about 21 minutes even with only seven new cases, two failing early.

Add a third entry to the existing Supply matrix for `quotation-receipt-correction.test.ts`. It owns a separate instance of the existing disposable PostgreSQL service. Preserve the original 22-case database group, runtime/compiled/restart group, serial file execution, 120-second individual deadline, 25-minute job limit and mandatory aggregate over every group. Both broad database shards, both complete broad browser runs and both compiled proof groups remain unchanged. This uses the existing isolation pattern without application infrastructure, dependencies, retries, omitted tests or relaxed assertions. Extending the shared deadline would retain a growing serial budget; concurrent reset/upgrade files against one database would invalidate isolation.

## Maintenance and ES-07 combined database budget — 7 October 2026

PR #357 head `e17aca5` completed 49 checks successfully, but [database-2](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37562875301/job/112603912391) hit the unchanged 90-minute job limit; the mandatory aggregate consequently failed. Its database phase recorded 436 passing cases and no failed assertion or individual timeout. Tests continued completing up to 04:07:51 UTC, less than two seconds before cancellation at 04:07:53. It did not finish the suite. Database-1 completed 437/437 cases in an 80m16s test phase. The retained cancellation and aggregate failure remain failed/incomplete evidence.

The unmodified current-main control `fbf2ed3`, [run 37560099482](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37560099482), passed both database jobs: database-1 took 54m37s overall with 560 cases; database-2 took 84m09s overall with 396 cases. These observations establish inadequate headroom in the two-shard arrangement and variable execution time. They do not establish an application performance regression or the cause of the difference between runners. Adding Maintenance files also changes the native shard assignment, so the counts are not a like-for-like per-domain performance comparison.

Expand the existing native matrix from two shards to **three**, `1/3`, `2/3` and `3/3`. Each remains an isolated GitHub runner with its own disposable PostgreSQL service and serial file execution. Keep the entire `tests/database/*.test.ts` discovery, every case and assertion, the 120,000 ms individual deadline, 90-minute job limit, fail-fast disabled and the mandatory aggregate over the complete matrix. Keep all browser, Finance, reports, HTTP/restart and focused jobs unchanged. Local `npm run test:db` still selects the whole suite. The new lane inherits the existing diagnostics preparation and uniquely named evidence upload.

This is a bounded extension of the existing isolation decision, using the pinned Node runtime and existing infrastructure. Increasing the deadline would retain the growing serial budget; concurrent files against one database would invalidate resets; hand-maintained allowlists could omit new tests; dropping or retrying cases would obscure incomplete proof. The [capacity evidence](../testing/evidence/maintenance-warranty/integration/ci-capacity/README.md) retains both original job logs and the current-main comparison. A synthetic native-runner selection probe checks every current filename exactly once and confirms a newly discovered failing file still produces a failing shard. That probe verifies partition selection only. Fresh application CI must execute and finish all three real database shards; local selection proof is not a database pass.

## Products combined assurance headroom — 7 October 2026

PR #358 head `d686723d4e2c0bb6893713f81532dfb041b9af36`, incorporating Maintenance/Warranty, passed all **52 checks across 18 workflows**. Its full database suite passed 984 cases (241 + 408 + 335), all 616 units passed, and the primary browser phase passed 650 cases with 79 retained skips. This is a successful source-specific checkpoint, preserved in the [Products capacity evidence](../testing/evidence/products-native/ci-capacity/green-checkpoint.json), not a relabelled failure.

The [second database shard](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37584595190/job/112671745846) took **89m42s**, leaving only 18 seconds before its 90-minute job deadline. The [primary browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37584595190/job/112671745949) took **86m56s**, leaving 3m04s. The other database jobs took 26m44s and 49m11s. Given the retained runner variation and previous incomplete runs, this is inadequate headroom for the combined tree despite a green checkpoint. File reassignment and runner variation prevent treating these durations as per-domain performance comparisons.

Extend native database selection to **four** isolated shards (`1/4` through `4/4`). Keep the complete discovered glob, serial files, 120-second individual deadline, 90-minute job deadline and mandatory aggregate. The native selection probe covers all 99 current filenames exactly once and requires a newly discovered failing file to fail exactly one shard; it executes synthetic markers only.

Use the existing compiled workflow's desktop/mobile project isolation for the primary full browser phase. The original `browser` lane retains every dedicated Facilities, mobile CRM, I2 and actual CRM application/PostgreSQL restart phase once, then selects `desktop-chromium` for its full browser run. An additional `browser-mobile` lane selects `mobile-chromium` against its own disposable database. Both keep the original warm-up dependency, browser/viewport configuration, assertions, screenshots and individual deadlines. Immediate browser artifacts are uniquely named per lane. All other steps, final diagnostics, Finance, reports, HTTP, focused jobs and the stable aggregate remain. The separate compiled workflow is unchanged.

The [selection proofs](../testing/evidence/products-native/ci-capacity/README.md#measured-headroom-follow-up) confirm that the two project selections cover all 729 original discovered cases (364 per browser plus the original warm-up). Only that dependency repeats across the isolated jobs. A parsed whole-workflow comparison permits only matrix distribution, full-browser project selection and uniquely named immediate browser evidence to differ. Application, SQL, tests, dependencies and both Playwright configurations match the successful checkpoint exactly.

This uses the existing runner/database isolation architecture without a new service, dependency, retry or omitted test. Increasing deadlines would retain growing serial budgets; concurrent database files would invalidate reset/upgrade proofs; maintained filename allowlists could omit future cases. Fresh final-head CI must finish every shard, browser project and mandatory gate; selection proof alone is not runtime proof. Earlier failed and successful checkpoints remain separately recorded.
