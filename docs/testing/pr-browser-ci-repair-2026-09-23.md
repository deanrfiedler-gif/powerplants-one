# Open-PR browser assurance repair, 23 September 2026

Owner: Dean Fiedler. Scope: requested repair of failing open pull requests; test harness and component verification only. Parent cases remain P11's controlled service-to-Finance journey, SH shared search/reviews and ES-08 specialist configuration. No application behaviour, schema, business authority or deployment changes.

## Initial customer readiness

PR #292's [diagnostic job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35847717020/job/107137789433) failed on source `b2d7d8810a866695974897776b813a449d54a3aa`. Its observer used the correct customer `/workspace` endpoint, but started its 15-second response timer before navigation. The saved browser lifecycle shows navigation completing at 5,076 ms and the customer request starting around 7,270 ms. Server diagnostics show both customer reads returning HTTP 200 around 12,100 ms after the observer began. The test's deliberate 6,500 ms delay then pushed browser delivery beyond its deadline.

The observer now optionally waits for the actual data request within the existing 60-second navigation budget, then starts its unchanged response budget. Only initial customer navigation selects this option. Command/render observers, the deliberate slow response, identity/status/no-store checks and business assertions remain unchanged. There are no automatic retries.

An unchanged-source retry was considered first, but GitHub refused it while the containing workflow was running. The queued local retry watcher was stopped after the server trace established the timing defect; no retry was started by that watcher.

## Abandoned reads before synthetic reset

PR #293's [broad browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35848257245/job/107139528966) returned 332 passed, 60 skipped and one failure on `4a67e4c96282f0bcdb52aa6f888951f4080123fd`. ES-08 fixture reset deadlocked with permission and engineering-change reads left by the preceding SH suite. This source already included main's `e11e0b3` teardown repair: waiting for current page traffic alone was insufficient because navigation can abandon a browser fetch while its server transaction continues.

The initial repair registered a fallback GET route before SH's specific test routes. It retained the real server read through `route.fetch`, preserving its response, and relied on `unrouteAll({ behavior: "wait" })` to wait for reads from earlier navigations too. That teardown order proved insufficient for overlapping reads; the PR #293 follow-up below supersedes it. Specific mocks keep precedence and POST commands keep their original transport. The database reset guards, migrations and application transaction handling are unchanged.

## Executed local verification

- Response regression against the original PR #292 helper: failed at the expected 15-second response timeout. The regression delays request readiness and response by eight seconds each.
- Repaired response regressions: four passes across desktop and phone emulation, including an immediate response and a refused response that still times out at the configured deadline.
- Drain regression without retained reads: failed because teardown completed while the controlled local server still held the read.
- Repaired drain regression: two passes across desktop and phone emulation. Teardown remained pending until the server read was explicitly released.
- Focused ESLint and TypeScript `--noEmit`: passed after both fixes.
- Local `python scripts/check_foundation.py`, `python scripts/check_prototype.py` and `python scripts/check_naming.py`: passed; all 78 parent IDs preserved.

The six browser cases use routed synthetic responses and an ephemeral loopback HTTP server; they need no application or database and do not reset the user's local data. The two failing-before/passing-after experiments establish the harness defects, not business acceptance. Full application browser and database results remain on each repaired PR's fresh CI run.

## Branch disposition

- #291 initially incorporated main `5499df4` as `ef8518e`, restoring the existing PL01 calendar-readiness and SH teardown fixes. Its DP-22/local-database documents remain intact. A subsequent diagnostic run failed during route warm-up with 108 unreachable routes before the journey ran; that is distinct from the customer timing defect. Fresh CI after these common fixes must establish its current result.
- #292 retains its adopted field-timer design changes and receives the common harness repair.
- #293 retains its CS completion evidence and receives the common harness repair after the newly observed deadlock.
- #290 had no failed checks at the latest inspection and is left unchanged.

Publication and current-head CI are separate from local evidence. No PR is merged or deployed by this repair.

## PR #293 follow-up: overlapping teardown and identity-switch readiness

The first repair, published at `193a72cb67c5219f652f688cc74e763332b7ae05`, introduced a teardown defect that its single-read regression did not cover. The [compiled job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852707951/job/107153893107) reported 335 passed, 60 skipped and four failures; the [broad browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852708046/job/107153894260) reported 336 passed, 60 skipped and three failures. Both encountered `route.fulfill: Route is already handled!` in three SH cases. Removing all routes while multiple `route.fetch` handlers are pending lets the first completed handler disable interception and continue other routes before their handlers fulfil them.

SH now waits for current page traffic, explicitly drains the retained reads while their route is still registered, and only then removes the routes. The regression holds two real loopback server responses and releases them separately, covering both navigation and AbortController cancellation. With the previous helper and teardown order, both desktop cases reproduced the exact CI exception. With the corrected order, all four desktop/phone cases passed, including assertions that teardown waits for both reads and neither read is forwarded twice. Errors are not suppressed and no retry is added.

The fourth compiled failure was PL-01's corrupt-storage/identity-switch case: it bypassed the existing calendar-readiness helper and clicked Plan visit before the new identity's calendar settled. The saved failure context contained no open dialog. Both panel openings now share that readiness check, and the second also waits for the identity change to finish. The original corrupt-storage, cleared-journal, denied-permission and disabled-save assertions remain.

The separate [diagnostic replay](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852708046/job/107153894322) failed before its three journeys ran. At 11:28:28 UTC the log records that the runner received a shutdown signal; warm-up then reported 114 unreachable routes. This is runner interruption evidence, not a reproduced application failure, and its reachability assertion is unchanged.

### Executed follow-up verification

These local results establish the repair published as `8bd6b93`, before incorporating the newer main branch described below.

- `npm run build`: passed using the default Turbopack build, ID `zhGK4Quv1Wl-MchfGuA5W`.
- Compiled browser run: **27 passed, none skipped, 5.2 minutes**. This includes ten PL-01 cases, ten SH cases, both immediately following ES-08 native/reset cases, four overlapping-read regressions and the warm-up dependency. All 450 warm-up routes were reachable. The isolated PostgreSQL log contained no errors or deadlocks.
- Runtime: Windows, Node `24.21.0`, Playwright `1.63.0`, approved local Chrome `153.0.8010.53`, PostgreSQL `16.15`. CI uses its installed reviewed Chrome channel; local results do not substitute for that run.
- Focused ESLint, TypeScript `--noEmit` and development-register integrity: passed; zero stale entries or integrity errors.
- Foundation, PP-01 prototype and naming checks: passed; all 78 parent IDs preserved.

The compiled run used `playwright.compiled.config.ts` and the ordinary deadlines with `pl01.spec.ts`, `sh-platform.spec.ts`, `specialist-workbench.spec.ts` and `browser-read-drain.spec.ts`, filtered by `PL01|SH |ES08 native six views|teardown waits`. A new loopback PostgreSQL cluster on port 55493 contained only its own `ppo_synthetic_test`; the compiled app ran on port 3059. Local evidence is retained under the repair worktree's ignored `tmp/pr293-focused.log` and `tmp/pr293-focused-results`. The user's existing database and unrelated Facilities edit were preserved. The fresh PR checks must establish the Linux CI outcome; this follow-up does not merge or deploy the PR.

### Current-main integration

After `8bd6b93` was pushed, GitHub reported PR #293 as conflicting and did not create new pull-request checks. Main had advanced to `7bf972c` through merged #290. Its only textual conflict was the document register: PR #293's three final CS statuses were retained alongside main's two new hosted-workspace records. All other main changes were incorporated unchanged. Foundation and naming checks passed on the resolved tree: 78 parent IDs, 4,375 local links, 3,180 text files and 410 document records. Fresh CI must verify the combined source. Incorporating an already merged branch does not deploy the hosted workspace.

## Applying the verified repair to all failing open PRs

Dean's subsequent instruction covers every failing open PR. At inspection, #291 (`c781c7f`) and #292 (`087ae9c`) failed both broad browser lanes with the same `route.fulfill: Route is already handled!` error. Each compiled lane reported 337 passed, 60 skipped and two SH failures; each application-browser lane reported 336 passed, 60 skipped and three SH failures. The failed aggregate on #292 simply reported the failed browser matrix result. Evidence: [#291 compiled](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852656642/job/107153733753), [#291 application browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852656651/job/107153734377), [#292 compiled](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852603083/job/107153559449), [#292 application browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35852602972/job/107153558625).

Both branches receive the verified five-file test repair from `8bd6b93`, including the PL-01 identity/calendar readiness guard. Their application source, scripts, tests, locked dependencies and build/browser/TypeScript configuration then have no differences from that tested source. Its 27-case compiled proof above remains shared evidence, rather than a claim that every application case was rerun separately on each branch. The four overlapping-read regression cases were rerun on each branch and all passed. Focused ESLint, foundation, PP-01 prototype and naming checks also passed independently on both branches; all 78 parent IDs remain intact. DP-22/local-database records remain on #291; the adopted FI-01 timer baseline remains on #292. No application or production behaviour changes.

#293 is already repaired at `633995a`; it also passed a second 27-case local compiled run after main integration, in 4.8 minutes with no skips or database errors. #294 and #295 had no reported failed checks at inspection and were left unchanged. Pending checks are not classified as failures. Fresh branch CI remains the authority for each final head.
