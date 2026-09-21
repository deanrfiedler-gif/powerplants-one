# PR #269 assurance repair, 21 September 2026

Scope: PJ-09 / PRJ-06 / PRJ-08 compatibility with retained CRM CA-03/10, EN-07 and P11 PT-29 assurance. The repair starts at `cee13538af319aaace1f29dd308f0bb7485e3ab4`, already reconciled with main `b4806af`. It changes three test files and maintained evidence only; application code, migrations 0032–0038, grants, stored receipts and issued output remain unchanged.

## Failed CI and diagnosis

[Application run 35554252551, job 106194672498](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35554252551/job/106194672498) failed its retained browser and PostgreSQL steps. The PostgreSQL run passed 467 of 469 tests. The other 17 PR check jobs, including the compiled-application browser suite, passed at the starting commit; those results do not claim verification of the repair commit.

- CRM's accepted-main upgrade compared migration-0009 Activity links with the current schema, without accounting for the generated nullable `project_id` column introduced by 0032. The repair compares every old value and explicitly requires all three later target columns (`opportunity_id`, `lead_id`, `project_id`) to be null. It strengthens the previous comparison that discarded two columns. Original operations, response history, issue bytes, hashes and revocation-preserving reseed assertions remain.
- EN-07's in-process helper reported 201 for prerequisite resolution, while the real `commandRoute(..., false)` returns 200. This ports exactly the helper correction from `b3c790838b0204cdb4cdf0b27e494c025ad091c2`, already used in the EN-07/EN-08 repairs. Create and replay status semantics remain distinct.
- P11 PT-29's mobile SC-01 recovery reloaded the document and immediately started a five-second loading assertion. The retained CI page snapshot says `Loading activities…`; identity was already available. Recovery now waits for the matching real GET 200 before asserting the rendered result, using the same 60-second read boundary as the existing initial-load check. Error, empty, unavailable and current-denial assertions remain intact. SC-01 deliberately delays its real response by 6.5 seconds so the former ordering cannot silently regress. No response body/status is fabricated for this recovery case, and no global timeout or retry is added.

The retained artifact was read selectively from GitHub artifact `10620471306` (`P11-retained-browser-evidence`). Its failure screenshot and error context were inspected; the complete archive and a trace were not downloaded. Extracted evidence and focused logs accompany this record.

## Local verification

Execution uses the isolated `powerplants-one-pj09-fix` checkout, pinned Node 24.21.0/npm 11.19.0/Playwright 1.63.0 and installed Chrome 153.0.8010.53, Windows with 16 GB RAM, PostgreSQL 16.15. CI used Chrome 153.0.8010.52. Database tests target only `ppo_synthetic_test` on task-owned port 55440. Browser work follows database completion; the test server uses port 3014. The owner's PJ-09 compiled review server remains on port 3001 with its separate development database.

The unmodified focused database run reproduced both CI failures (0/2 passed, 59.0 seconds). After the repair, the complete CRM and EN-07 database suites passed **34/34**, no skips or retries, in 386.2 seconds:

```powershell
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='accepted-main upgrade|EN07-A25' tests/database/crm.test.ts tests/database/engineering-changes.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/crm.test.ts tests/database/engineering-changes.test.ts
```

The first command is the unmodified negative run; the second is the corrected full-suite run. [Before](database-before.log), [after](database-after.log). This includes the complete EN-07 closure path after the formerly failing prerequisite assertion, and CRM's upgrade from 0009 through 0038, original receipts/issued bytes/history, current permissions and repeat seed checks.

The initial browser execution adapts only imports and the explicit origin to the isolated port in ignored copies. Assertions, fifteen screen families, desktop/mobile project names, viewports, Chrome channel and ordinary assertion budgets are retained. A separate negative copy keeps the 6.5-second delay but removes only the new recovered-read wait. Source hashes and the reproduction harness are retained for comparison.

The [negative control](browser-negative.log) fails at the same mobile SC-01 recovery assertion after five seconds (`Expected: 0`, `Received: 1`), with its case taking 43.0 seconds. [Original CI capture](ci-mobile-loading.png), [local negative capture](negative-mobile-loading.png). These are genuine failing runs, not expected-failure annotations or retries.

```powershell
python tmp/pr269-repair/prepare-browser.py
npx playwright test --config tmp/pr269.config.ts quality-before.spec.ts --project mobile-chromium --grep 'all fifteen' --output tmp/pr269-negative-results
npx playwright test --config tmp/pr269.config.ts quality-states.spec.ts --output tmp/pr269-positive-results
npx playwright test --config tmp/pr269.config.ts quality-mobile-isolated.spec.ts --project mobile-chromium --grep 'all fifteen' --output tmp/pr269-mobile-results
```

The retained [harness generator](prepare-browser.py) belongs at `tmp/pr269-repair/prepare-browser.py` when reproducing from the repository root. It requires the existing ignored synthetic-test environment and a running task-owned server at 3014; it creates no credentials. [Source hashes](test-source-hashes.json) identify the original and adapted test sources.

The initial corrected run passed both desktop cases and the phone queue case, but the phone matrix stopped during fixture setup with `ResourceConflict`: the negative control had already reserved the same crew on 2031-11-06. This is retained as a failed run, not counted as a phone recovery pass. Inspection confirmed that recorded work prevents normal cancellation; no cancellation or database edit was attempted. The isolated phone replay uses 2031-11-13 (the same weekday one week later) and retrospective time slot 44 instead of 42. Those two fixture literals are its only changes beyond the origin/import adaptations; all state, response, permission and delayed-recovery assertions are identical. Existing fixture history is retained, and neither scheduling guards nor application code is changed.

All four P11 browser cases now have passing executions: the [initial corrected run](browser-after.log) passed the desktop queue case (6.0 seconds), full desktop matrix (3.4 minutes) and phone queue case (5.5 seconds); the [isolated phone replay](browser-mobile.log) passed its complete matrix (2.8 minutes). This is three initial passes plus one isolated replay, not a single clean four-case run. No test is skipped or marked as an expected failure, and automatic retries are disabled. Both matrices retain all fifteen screen families and their actual final server denials: [desktop results](desktop-state-matrix.json), [phone results](mobile-state-matrix.json). [Recovered desktop capture](desktop-recovered.png), [phone capture](mobile-recovered.png); the phone's result list is below the captured filter area inside its scroll container, so its screenshot alone does not prove recovery.

Final `npm run typecheck` and targeted ESLint passed: [TypeScript log](typecheck-final.log), [lint command/result](lint-final.log). Documentation [foundation](foundation.log), [naming](naming.log) and `git diff --check` passed. Task-owned test server 3014 and PostgreSQL 55440 were stopped after verification; the unchanged PJ-09 review at 3001 returned HTTP 200.

Route compilation preparation is separate from test assertions. The [broad warm-up log](warm-up.log) records the initial pass, deliberately stopped during unrelated module compilation. The [remaining P11 warm-up](focused-warm-up.json) then reached all 91 selected endpoints with zero unreachable, taking 193.0 seconds. This is not a completed all-route warm-up claim or an application response-time benchmark. All page modules and the remaining relevant P11 prerequisite/read routes were prepared before the browser runs; test assertions and budgets were not changed to hide compilation.

## Limits

This is local regression evidence. It does not rerun the complete 469-test database job or all 18 CI jobs, and does not repeat the PJ09-01–56 acceptance matrix, restart, owner or physical-device proof. Existing compiled build and visual evidence belong to the earlier implementation/merge record. The repair changes no application runtime, so no new build or visual-conformance claim is made. Hosted deployment, merging to main, production use and external communication are outside this repair.
