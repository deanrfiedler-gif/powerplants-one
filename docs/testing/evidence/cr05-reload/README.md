# CR05 saved closure reload verification

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Executed:** 27-28 September 2026 (Sydney; CI timestamps are UTC). **Status:** Synthetic browser correction verified locally and on final PR heads; all three protected merges completed. Functional proof does not grant visual or owner acceptance.

## Original failure and diagnosis

PR #322 at `ab61c06cf9298d650bfe5072970b97e0e80f1363`, [run 36313348099, original job 108603349591](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36313348099/job/108603349591), and PR #323 at `3fd6ec192b137707ef69c83b0cf36ea0b85283fb`, [run 36315063110, job 108608105798](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36315063110/job/108608105798), each recorded **519 passed, 79 skipped, one failed**. Desktop CR05 failed after reload at the five-second `Closed` visibility assertion; both contexts still showed Loading aftercare review. The preceding Closed assertion succeeded. Mobile CR05 passed in both runs.

Contrary to the earlier handover label, **both failing lanes used `playwright.compiled.config.ts`**, as recorded by the workflow command and retained results configuration. They were not development-server runs. Sales runtime, its resource hook and this spec were identical to unmodified main `336ba908f5512db7d24057b0c4c3842a831e00be`. Its [browser job 108606832229](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36314610335/job/108606832229) passed 520 cases with 79 skips, including desktop CR05 in 19.2 seconds and mobile in 17.5 seconds.

The test synchronised only with document `load`. `AftercareDetail` then starts an asynchronous GET through `useCrmResource`; document load does not establish that the saved record is available to render. This is a test synchronisation defect exposed by variable loading time. The original artifacts deliberately exclude raw trace ZIPs, and the gateway diagnostics reached their 60,000-event cap before CR05. Consequently the original runs do **not** identify whether their extra time was hydration, application/database work or runner contention. No database loss, runtime deadlock, harmless environment-only explanation or performance improvement is inferred.

A controlled local reproduction kept the actual compiled runtime and real database response: the reload GET returned HTTP 200, Closed, version 7 in 524 ms, then a route held those exact response bytes for 6,200 ms before delivery. The original five-second assertion failed with the same loading state. The retained local trace confirms document reload completed before the pending record response reached the page. This demonstrates the synchronisation fault; the injected delay is not a measurement of CI or application performance.

## Additional original retry

The already-running retry of original #322 source `ab61c06` completed as another failure: [attempt 2, job 108614290307](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36313348099/job/108614290307), again 519 passed / 79 skipped / one failed. This time line 427 failed **before reload**. Retained context shows **Close saved**, **Saved version 6**, **Review Completed** and **Loading the saved revision before the next action**. The save receipt and the following resource refresh are separate asynchronous operations. Waiting for the POST alone does not establish that its refreshed record reached the UI. No further original-head rerun was requested. [Minimal original retry record](original-retry.json) pins the private retained log/context.

## Correction and executed checks

`tests/browser/sales-workflows.spec.ts` now observes the exact Close POST and validates its receipt, then waits for the exact record refresh carrying Closed and checks it against the receipt version before the first unchanged visible assertion. It ignores an older pre-closure poll when selecting that refresh. Before reload it registers the exact record GET waiter, then requires HTTP success, Closed state, the receipt's saved version and unchanged attributed feedback. The original post-reload visible Closed assertion remains at five seconds. No runtime change, skip, retry, blanket deadline change or performance-threshold change is introduced.

- Original delayed-response control: three preceding Sales cases passed; CR05 failed as expected.
- Corrected delayed-response control: desktop and phone passed with the same 6,200 ms hold of the real response.
- Negative control: substituting ReviewCompleted in the reload response failed the persisted-state assertion as expected. The underlying saved database remained Closed.
- Normal compiled Sales suite: **8 passed**, covering CR01/04, CR02, CR03 and CR05 on desktop and phone; no delay or response substitution in these cases.
- Compiled build, lint, type checking, formatting, foundation/prototype/naming and design-register assurance passed. The register has 320 entries and 29 components; all 320/29 reviews remain pending. The first sandboxed register invocation failed in tsx user lookup (`uv_os_get_passwd`); the ordinary user-context invocation passed without source changes.

Environment: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and Chrome 154.0.8037.58. A newly initialised loopback cluster on port 55440 contains only `ppo_synthetic_test`; earlier return/update/policy proof databases were not reset or reused. The document store is a separate private temporary directory. Initial seeding correctly refused a Windows short-path alias; using its canonical path resolved setup. An initial anchored test selector found no tests; the corrected selector executed the recorded cases.

The compiled launcher was explicitly started with `--compiled`; its PID owned port 3000 and returned HTTP 200 before testing. Local Playwright configurations set `webServer: undefined`, preventing either compiled or development fallback startup. Runtime/build source is `ab61c06`; only the browser spec changed. No application unit or schema behaviour changed, so no mirror unit test was added. Full repository database/browser assurance remains ordinary PR CI.

[Minimal trace observations](trace-summary.json) retain only methods, timings, statuses and assertion parameters; [manifest](manifest.json) pins the source, local logs and private traces. Original CI artifacts and local raw traces remain private and distinct from corrected results. To reproduce the diagnostic, intercept only the exact aftercare GET immediately before reload, fetch the real response, hold it 6,200 ms, then fulfil with that response; for the negative control change only `record.state` to ReviewCompleted. These interventions are diagnostic copies of the spec, not committed application behaviour.

PT-27 timing misses, complete PT-28/PT-30, independent physical-device/accessibility/visual review and production readiness remain open. No deployment or external business action occurred.

## Saved-refresh correction verification

The first correction `a17c670` still reproduced the newly observed pre-reload race when the actual post-close resource response was held for 6,200 ms: three preceding desktop Sales cases passed and CR05 failed at the unchanged first five-second Closed assertion. The real Closed response was HTTP 200/version 21 in 276 ms before the deliberate hold. The extended waiter then passed both desktop and phone with **both post-close and reload reads** held, including an older ReviewCompleted poll ahead of the saved Closed revision. The final normal compiled Sales suite passed all eight cases. A fresh negative control still failed the exact post-reload persisted-state assertion when only that response state was replaced. See the [separate follow-up manifest](refresh-correction.json); original evidence remains unchanged.

These follow-up cases use the compiled runtime from `bd8e23f9a4e12314e49bddc48170eb0d4a73cba8`, build `UZPI1x18dLnHDUDBsGSWz`; Sales runtime matches main and the correction branch. The explicit compiled launcher PID 35556 owned port 3000 and `/api/v1/health` returned HTTP 200; fallback launchers stayed disabled. An initial readiness probe used the wrong `/api/health` path and was corrected before tests started. A local type-check invocation on the older #322 branch encountered generated `.next` references to the later #324 routes; the final stack is checked with matching source/build rather than deleting evidence or pretending that invocation passed.

## Corrected stack verification

At runtime source `bd8e23f9a4e12314e49bddc48170eb0d4a73cba8`, [fresh retained checks](stack/manifest.json) passed 14 policy units, seven real PostgreSQL cases and eight compiled desktop/phone browser cases (six policy/navigation plus two CR05), with a fresh build. The new disposable database was reset only while this task's application was stopped; earlier proof environments were untouched. Policy runtime still matches `89faa07`. Documentation planning was in progress, so this is an exact runtime/build pin, not a claim of an entirely clean working tree. Full fresh PR CI remains distinct.

After the saved-refresh correction was merged through the complete source stack, matching-source type checking, full lint, foundation, prototype, naming and `studio:check` passed on local integration `493dda5`. The final register contains 321 entries, 167 routes and 29 components, with all 321/29 reviews still pending. This resolves the earlier generated-route mismatch without changing source or deleting the retained compiled build.

After the final saved-refresh correction was pushed, only the still-running Application assurance workflows on superseded intermediate heads were cancelled: `36319765568` (`a17c670`), `36319846275` (`547c7a0`) and `36319987121` (`bd8e23f`). Their completed results and original failure evidence remain retained. They are not final-head passes; protected integration requires the new head-specific checks.

## Final-head browser CI

Both the compiled-suite workflow and the originally failing Application assurance browser lane passed on each final head: **#322 `f3f560d`: 520 passed / 79 skipped; #323 `67aa70c`: 520 passed / 79 skipped; #324 `724e9d6`: 524 passed / 79 skipped**. CR05 passed on desktop and phone in all six jobs. The [exact job URLs, head pins, result lines and private-log hashes](ci-final.json) distinguish these results from every original failure and superseded run. All skips already existed; none was added by this correction.

Desktop CR05 whole-case durations in the Application assurance lane were 48.8, 37.9 and 22.0 seconds respectively, compared with 19.6, 19.3 and 19.9 seconds in the separate compiled workflow. These are whole-journey durations, not isolated GET/render measurements. The saved receipt, both exact read boundaries, persisted version/feedback and unchanged visible assertions passed despite that variation. No runtime latency improvement, threshold achievement or causal explanation for the original CI delay is claimed. Final database/aggregate checks and merge results are retained in the separate [protected integration record](integration.json) and policy handover.
