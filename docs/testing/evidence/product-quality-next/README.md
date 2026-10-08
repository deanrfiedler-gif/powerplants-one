# Product quality increment evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution: 8 October 2026. Baseline: merged #369, main `f0953c5f9f5a0c5e1c5179ef933fd87c9e37b00e`. Scope: [independent PPO direction](../../../decisions/product-direction-quality.md). CREMS is historical background; issued reference bytes and all 78 parent IDs remain unchanged. This increment changes no dependency, migration, grant, workflow, hosted deployment or business transaction.

The private loopback compiled app uses an isolated PostgreSQL 16 cluster, disposable `ppo_synthetic_test`, Node 24.21.0, Chrome 154.0.8037.98 and Playwright 1.63.0. Browser projects are desktop 1440 × 1000 and phone 390 × 844 with mobile/touch. The measurements and journeys are fictional local evidence, not owner, physical-device, accessibility or operational acceptance.

## Confirmed gaps and corrections

The baseline offline completion form could not create a draft with over 30 local dependencies. Its advice to synchronise and refresh still left the user at the same form without an explicit continuation. The [retained failed baseline capture](handoff-baseline.png) and [page state](handoff-baseline-error.txt) show that boundary. The initial enhanced handoff test failed on the missing button; its source subsequently evolved, so its old generated code-frame line is not treated as the current test source.

`src/offline/app.ts` now provides **Continue completion online**. It refuses pending, uncertain, review-required or recovery originals, verifies the active owner, obtains the ordinary permission-scoped current job, rechecks the queue, and requires accepted own attendance and the original captures in the current read. It navigates to the existing job completion UI without deleting originals or increasing the protocol's 30-dependency limit. Existing unsaved-input navigation protection still applies. Online submission retains its own pending-original guard and server checks.

The initial fixed desktop/phone test passed 3/3 including warm-up: 99 notes plus one original PNG, 104 retained wire originals, lost-response refusal, exact replay, online draft and submission. Final strengthened coverage additionally checks retained originals after reload, the actual coordinator Service review with all 100 references and exact PNG bytes, unavailable/denied current-read responses, identity change and cancelled navigation with unsaved wording. The 503/403 cases are deliberately intercepted responses; they do not claim an actual grant revocation. The identity change and successful Service review use real sessions and server permissions.

Screen inspection found a separate timer label defect: after submission, the job could be closed while the independent timer read still showed Ready to start and an enabled Start. A [controlled delayed-read reproduction](timer-closure-baseline.json) and [capture](timer-closure-baseline.png) confirm it. The timer now closes fresh controls from the current own report/accepted attendance as well as its own response. The guard includes an already-open dialog, Pause choices, Undo and the send handler. Notes and uncertain original reconciliation remain. The regression delays the actual successful submission response, opens a Start dialog, then checks that the arriving closed job disables submission without losing its note.

## Measured customer-read improvement and remaining delay

The existing full PT-27 CI benchmark at [#369's exact head](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37747201614/job/113211387671) missed the candidate three-second p95 in all 16 development groups and 14 of 16 compiled groups. Customers was the slowest read. A successful benchmark job records measurements; it does not certify target attainment.

Source inspection showed relationship counts projected in the full materialised permitted set before selecting 25 rows. The diagnostic EXPLAIN summary reported about 262 ms execution and 377,715 shared buffer hits. Removing the materialisation keyword alone did not meaningfully improve it and was not adopted. [Diagnostic plan summary](directory-explain.txt), [exploratory samples](directory-preliminary.json).

The bounded implementation calculates relationship counts after pagination for organisation sorts that do not use those counts. Numeric count sorts still evaluate the full permitted population. People, active relationships, access predicates, full filtered total, search and ID tie-break order retain their meaning. The database regression places a customer with relationships beyond the default first page and checks complete totals, later-page counts, numeric sort precedence, filtering and company isolation.

The retained fixture has 1,000 organisations, 5,000 assets and 10,000 appointments. Twenty actual service outputs across coordinator/second-company identities, text search, pages, count sorts and People match the baseline exactly. Each timed candidate sample is also asserted against the expected authorised page. The final before/after fixture fingerprints match across the seven declared business tables; this does not claim whole-database equality. The earlier baseline browser file had no post-run fingerprint, so none is added retrospectively.

| Same-host observation | Baseline | Initial candidate | Final candidate |
|---|---:|---:|---:|
| Read-service p95, 40 calls / ten concurrent | 792.51 ms | 168.99 ms | 212.64 ms |
| Desktop browser ready p95, 40 navigations | 5,185.87 ms | 8,104.11 ms | 6,625.56 ms |
| Phone browser ready p95, 40 navigations | 3,297.61 ms | 2,751.95 ms | 3,320.60 ms |
| Desktop core-request-to-body p95 | 1,860.39 ms | 1,106.07 ms | 1,902.53 ms |
| Phone core-request-to-body p95 | 1,709.72 ms | 676.01 ms | 828.09 ms |

Raw [service baseline](baseline.json), [initial](candidate-initial.json), [final](candidate.json), [browser baseline](browser-baseline.json), [initial](browser-candidate-initial.json) and [final](browser-candidate.json) retain every sample, source/build identity and limits. No slow first wave is removed. The initial browser candidate included new content assertions inside its timing endpoint; it is retained with that limitation. The final script records the original settled endpoint, then immediately asserts the exact response hash and rendered names as postconditions. All 80 final navigations had exactly one core request and correct content. The additional service confirmation uses one expected-page read before its timed waves; ordered cache effects remain a limitation.

The browser experiment uses ten separate Chrome processes, four waves per viewport, 40 ms latency and 1.25 MB/s download. It is a focused Customers experiment, separate from the full PT-27 suite and hosted infrastructure. Query cost improved; complete page readiness did not establish an improvement. First navigation/asset delivery and remaining rendering/identity costs need further profiling. This evidence changes no acceptance threshold and grants no three-second target pass.

Reproduce after preparing the private disposable app environment: run `quality-directory-proof.ts baseline` against the baseline source with `PPO_BENCHMARK_FIXTURE=add-synthetic-load`; retain that database and its generated baseline file. Run `quality-customer-browser-proof.ts baseline` after compiling the baseline. Apply the candidate, compile it, then run both scripts in candidate mode against the same retained fixture. Candidate mode refuses changed fixture hashes. Set the private port consistently. Do not reset between before/after measurements. This is an ordered comparison, not a randomised causal trial.

## Verification and review boundaries

The directory/CRM PostgreSQL run passed all **53** tests, including the new pagination/count case, scoped reads and retained concurrency/owner-transfer cases. [Database log](quality-db.txt). The selected compiled browser run at `af34bbe` completed with **21 passes and two failures** in the new exact-label note assertion. Both failure captures and the trace show the exact note retained and Start disabled. The controlled textarea acquired a child text node with its value, which made the exact wrapping-label selector fail; its accessible textbox name stayed Short note. The fixture now locates that textbox by role and selects the specific frozen status (the dialog also has an Unsaved status). The two affected cases are being rerun; no application change or assertion deadline change was made for this correction. Final results and artifact hashes are being completed before publication. Build, full lint, typecheck, studio, naming, foundation and prototype checks have passed at their recorded local stages. The copy-ready instruction block is 7,725 characters, below its 8,000-character limit; an earlier oversized draft is an authoring failure, not an application failure.

The full local unit run has 626 passes and three failures. All three reproduce on a separate clean checkout of exact main `f0953c5`: two local document-store tests report ExactDocumentUnavailable and the recovery-path test expects a different refusal message on Windows. [Full candidate log](quality-unit.txt), [unchanged-main control](quality-unit-baseline.txt). The failures are retained, not suppressed or counted as passes. Linux PR CI remains separate.

Other authoring/environment observations: the first private database reset failed transactionally at default lock capacity and passed after restarting only this test cluster with the existing CI-equivalent increased capacity. The first candidate measurement invocation correctly refused a missing explicit load-fixture environment flag before workload execution. The initial handoff proof predates its strengthened Service-review and stale-dialog assertions; its 3/3 result is not attributed to the final test source.

An independently coordinated automated review of the source and retained proof objects found no remaining blocking source defect after the timer dialog guard and measurement postconditions were added. That review included output equality, permission predicates, pagination, source hashes, fixture preservation and the mixed browser result. Runtime outcomes are recorded separately. No owner or human visual acceptance is inferred.

The [release snapshot](release-checks.json) records all 50 completed successful checks on baseline main `f0953c5`, separately from #369’s 51 successful PR-head checks and this increment’s future PR checks. Log text is normalised for trailing whitespace and private checkout paths; substantive error results are retained.

## Connected walkthrough observations

Both desktop and phone passed the maintained commercial chain (same Lead, Deal, estimate/quotation, Project receiving and owned returned Lead) and the separate Service-to-Finance journey (controlled booking, attributable originals, exact customer response, reconciled synthetic Finance outcome and separate return visit). These are two declared synthetic scenarios; no single cross-module business record is invented to join them. Native HTTP preparation remains separate from the browser handovers.

The Customers captures show the same scoped total of 999 from 1,000 fixture organisations, readable references and counts, desktop table/pagination and phone cards. The phone first viewport devotes substantial space to navigation and filters; reducing that space is a candidate for owner usability review, not an accepted redesign. Timer-dialog inspection confirms retained note text and explicit frozen-state guidance. Final completion/Service-review captures will be inspected after the focused case passes.

## Next bounded work

1. Profile first-navigation asset/identity/render timing and the other slow PT-27 reads, retaining complete samples and the existing target.
2. Conduct the owner walkthrough on intended devices: real navigation choices, recovery understanding, keyboard/screen-reader use and acceptance observations. An automated synthetic journey does not supply these observations.
3. Continue independently defined PPO estimating rules and remaining module work using explicit requirements and tests. Missing CREMS parity is no longer a dependency; live commercial values, technical authority and integration evidence retain their own obligations.
