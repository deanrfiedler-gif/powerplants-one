# CI browser suite against the compiled application

**Decided:** 11 September 2026 · **Owner:** Dean Fiedler (approved the recommended approach) · **Scope:** test harness and CI only · **Status:** implemented on the linked pull request as an additional signal; replacement of the development-server browser step is a later decision

## Problem

The browser suite has only ever driven `npm run dev`, the Turbopack development server. The hosted Azure demo runs the compiled application. Two consequences: first-request compilation lands inside assertion windows ([CI browser suite route warm-up](ci-browser-warm-up.md), issue #113), and the compiled code that invited testers use has never been driven by the 140-case suite, even though every Application assurance run already produces it through `npm run check`.

## Invariant that is preserved unchanged

`localConfig()` refuses synthetic identity whenever `NODE_ENV` is `production` or any hosted-platform marker is present; `demoConfig()` requires Entra identity **and** `NODE_ENV=production`; `npm start` is refused outright. Not one of these lines changes.

## Decision

Treat *compiled application* and *production environment* as separate things. The loopback synthetic-identity launcher gains a `--compiled` flag that serves the completed `npm run build` output with `next({ dev: false })`. `NODE_ENV` defaults to `test` in that mode — a value the pinned Next.js 16.3.4 accepts for a custom server without warning, and one the guard treats as non-production. The launcher refuses to start in compiled mode without `.next/BUILD_ID`. With no flag the launcher behaves exactly as before.

`playwright.compiled.config.ts` spreads the ordinary configuration and changes only the server command to `npm run serve:compiled`, so projects, viewports, deadlines, assertions and the warm-up dependency are identical. The warm-up is kept deliberately: it records compiled first-request timings beside the development-server ones as the control measurement.

A new workflow, **Compiled application browser assurance** (`application-compiled.yml`), runs on push and pull request beside Application assurance. It builds as a separate step, so a build failure is distinguishable from a test failure, migrates and seeds the same disposable database, runs the same browser suite against the compiled server and retains evidence as `compiled-application-browser-evidence`. Application assurance is not changed.

## Verification

- Guard: `NODE_ENV=production` with `--compiled` still fails with "Synthetic identity requires an explicitly local, unshared, non-production environment." (executed locally).
- Local, Node 22.22.2 (project pins 24.20.0): `npm run build` completed in 77 s; `tsc --noEmit`, `eslint` and 67/67 unit tests pass; `playwright test --config=playwright.compiled.config.ts --list` shows the same 70 + 70 + 1 as the ordinary configuration.
- End to end: Playwright started the compiled server through the new configuration and the warm-up project requested all 211 routes in 3,321 ms with none unreachable; slowest first request 637 ms (`/api/v1/appointments/…/completion-draft`). By comparison the development server has taken more than five seconds to answer a single first request under load (issue #113).
- Not executed locally: the browser projects (no Chromium in the sandbox). The first run of the new workflow is the proof.

## Honest scope

This drives the same compiled routes and pages as the hosted image, under synthetic identity rather than Entra sign-in, on loopback rather than in the container, with development React on the server (the client bundle is production). It tests the deployed code, not the deployed container. Driving the Entra-fronted image directly would require an authentication bypass, which is the wrong trade for a prototype whose identity guard is its main safety boundary.

## Acceptance and follow-on decision

Five consecutive clean runs of the new workflow on `main` and pull requests. After that, decide separately whether the compiled run replaces the development-server browser step in Application assurance or both continue; replacing it immediately would drop the only coverage of the development-mode behaviour local work relies on.


## 14 September 2026 — original command completion before result assertions

Dean authorised audit follow-through. [Issue #153](https://github.com/deanrfiedler-gif/powerplants-one/issues/153) addresses two observed browser assertion failures, preserving their original evidence:

| Original run | Observation | Retained original archive |
|---|---|---|
| [Main Application 34773539502, job 103767373173](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34773539502/job/103767373173), source `39caa8ed0fe04ff157f1933c963e9653bb118945` | The broad browser suite passed 148 cases. The retained P10 run then failed the first Finance draft URL assertion while the original screenshot still showed **Saving exact draft…**. Two dependent F-06 fixture tests subsequently failed because their prerequisite reconciled record was absent. | Artifact `10323803435`, 152,254,974 bytes, SHA-256 `dc13fe06ba4713f305a6e3ef5346d7f856df47736180e70374fb93584261434e` |
| [PR #151 compiled 34750621285, job 103706383584](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34750621285/job/103706383584) | 147 passed, one failed, one skipped. The mobile P11 report-response poll saw zero responses while the initial screenshot showed a busy response form. Its later error-context snapshot contains the saved **Accepted With Reservations** response and owned follow-up. | Artifact `10315960706`, 114,585,886 bytes, SHA-256 `f744c61e21eaebf11d29c06588bc3fd41a9804b42b4cb19af835260ca20314bf` |

Both archives passed ZIP integrity validation. Original failure PNGs and error-context snapshots were inspected; no original image or output was regenerated. Raw session traces are absent from the reviewed uploads. These observations support checking command completion before starting the result assertion; they do not establish the cause of save latency or a performance improvement.

The two affected actions now use the existing `committed` helper: register the exact POST response listener, activate the original control once, require an accepted private/no-store response, then perform the original persisted-result assertion. The Finance detail ID must additionally equal the ID returned by that original command. Report submission remains keyboard-only. There is no new retry, timeout change, fixture substitution, policy change or application change. The original URL and response-count assertions and all downstream business assertions remain.

Local lint, type, 83 unit checks, production build and all three Python documentation checks passed under the pinned Node 24.20.0/npm 11.19.0. The build retained the existing dynamic-filesystem tracing warning in report template fingerprinting. Fresh CI results must be recorded on the contribution before merge; local PostgreSQL and browser execution were unavailable. Full P11 publication and P12 acceptance remain separate work, and neither original failed run is promoted to a pass.

## 4 October 2026 — preserve compiled broad and retained proof within separate bounded jobs

PR #344 head `483fd6626df4b5cb39410a87b8e817e333088e5c` passed the complete compiled browser invocation: 578 passed / 79 retained skips in 56.6 minutes. The [job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37191393453/job/111404146634) then reached its existing 60-minute limit during the separate 18-case Scheduling invocation. Timer and policy restart steps did not run. The workflow is cancelled, not passing. Its workflow source was identical to refreshed main, but that timed execution has not been reproduced on unchanged main and is not labelled a baseline failure.

Apply the existing Application assurance isolation pattern within this workflow. One job retains the entire broad desktop/mobile invocation and original 60-minute limit. A second, bounded to 25 minutes, retains the separate Scheduling invocation followed by timer and policy restart/zoom proofs. These already use isolated fixtures or explicit clean database resets; they do not consume the broad suite's records. Each existing GitHub runner builds the same source head and owns its disposable PostgreSQL container. Preserve every command, project, assertion, test deadline, fixture boundary, original restart and artifact path. Distinct artifact names prevent overwrite. No browser test is split, dropped or retried; both broad browser modes and both database shards remain mandatory.

The stable compiled check name becomes an aggregate gate requiring both jobs to finish successfully, including when a job fails or is cancelled. Independent jobs use `fail-fast: false`; their results and evidence remain visible. This adds no framework, dependency, external service or deployment infrastructure. Extending the serial job's deadline would obscure its exhausted budget; dropping retained proof would lose coverage; rerunning the cancelled job would not repair the coupling. None is adopted. Fresh final-head CI must prove both groups and the aggregate; earlier successful browser cases do not stand in for the previously unexecuted restart steps.

## 6 October 2026 — isolate desktop and mobile compiled projects

**Owner:** Dean Fiedler. **Review status:** proposed CI correction; functional execution and owner acceptance remain separate. **Traceability:** PP-01 / AT-23 and AT-34; continuation of the compiled assurance decision above.

PR #349 merged as `61babd1a073d0163e87069a033e56ce74d5e5773`. Its [post-merge browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37401364963/job/112069056429) reached the 60-minute job limit while still completing tests: the log records 591 passes and 69 existing skips, ending at case 660 of 679. No failed assertion or retry is recorded before cancellation; the remaining 19 outcomes are unverified. The [aggregate](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37401364963/job/112084568291) correctly failed because its required matrix result was `cancelled`. The independent retained proof passed in 6 minutes 22 seconds.

The [final PR-head browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37393221311/job/112042958247) passed 600 cases with 79 retained skips in a 56.1-minute invocation; total job time was 58 minutes 41 seconds. Its source tree equals the merged tree (`git diff 19606c5a7a27b78a4f70e5d2a228c1458ebc1131 61babd1a073d0163e87069a033e56ce74d5e5773` is empty). This establishes insufficient margin in the serial job, not a new assertion failure or a measured application performance improvement. The exact cause of the run-to-run duration difference is not established.

Split the broad invocation at its existing Playwright project boundary: `desktop-chromium` and `mobile-chromium` each run in an independent matrix job, with their own compiled server, fresh disposable PostgreSQL database and unfiltered `warm-up` dependency. Each project retains one worker, original test order, fixtures, assertions, skips, retries and deadlines. The 60-minute job limit remains; retained Scheduling/timer/policy proof keeps its separate 25-minute job. The stable mandatory aggregate requires all three jobs to succeed, with `fail-fast: false` preserving independent outcomes.

Keep the existing evidence paths inside each archive. Use distinct `compiled-application-browser-desktop-evidence` and `compiled-application-browser-mobile-evidence` artifact names; `compiled-application-retained-evidence` is unchanged. Reviewers must inspect both browser archives. No in-repository consumer selects the former broad artifact name. A new browser project must be included in this matrix and the complete discovery comparison repeated.

This uses existing GitHub Actions and Playwright facilities, adding one runner/build/database setup per workflow. Increasing workers against the same database risks concurrent resets; increasing the job deadline leaves serial growth unresolved; dropping cases or allowing the aggregate to pass cancellation loses assurance. None is adopted. Application assurance's independent broad invocation is unchanged. The shared warm-up now executes once per isolated browser job; its duplicate is setup coverage, not an additional business test.

Validation must compare the complete discovered `(project, file, location, title)` population with the union of both selected projects, allowing only the duplicate warm-up. Fresh CI must then execute both isolated projects and retained proof before a passing workflow can be claimed. Historical failed/cancelled runs retain their original conclusions. This change does not establish deployment, visual/device acceptance or full PP-01 acceptance.

Local validation on Node 24.21.0 / npm 11.19.0: Playwright discovery contains 679 cases unfiltered and 340 in each selected job. Their union is exactly 679, with zero missing/extra cases and only the one warm-up duplicated. Workflow YAML parsing and all embedded Bash syntax checks pass. The unchanged aggregate command accepts `success` and rejects `failure`, `cancelled`, `skipped` and an empty result. Foundation, prototype and naming checks also pass (78 parent requirements preserved; no documentation errors). This is discovery/gate and documentation proof; full split-job execution remains pending CI.
