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
