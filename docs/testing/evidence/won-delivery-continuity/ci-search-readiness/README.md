# Search readiness repair for Won receiving CI

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Scope: a browser-proof readiness boundary; no application, database, permission, source snapshot or issued record change.

[PR #364 desktop job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37582324816/job/112664578174) at `e8dd290` passed 360 tests with 13 retained skips and one failure. The retained screenshot and context show global Search still displaying “Searching permitted sources…” when the five-second results-layout assertion expired. No completed response or server error is shown in that evidence. The uploaded evidence did not include the trace archive, so an exact request duration or server performance cause is not claimed.

The geometry journey now observes the exact initial GET `/api/v1/search` for its query before testing rendered results. It uses the existing My Work pattern: a bounded 15-second initial read deadline, a required 200 status and the unchanged ordinary render and geometry assertions. The observer is registered before navigation; no retry or accepted failure is introduced. Dedicated positive and negative controls delay the actual initial search by six seconds and refuse a 503 response.

Local verification passes all six repair cases: the delayed read, failed read and retained complete shell geometry journey on desktop and phone. The combined run passes 18/18 in 2.1 minutes; the other twelve cases exercise the LC-17 working tree and retained CRM/Projects journeys. See [local log](local-browser-proof.txt). The initial positive control incorrectly assumed only one GET, although the app issues two; that invalid count assertion was removed. Its failed screenshots remain labelled initial. No application retry or render assertion was changed. The compiled app is the LC-17 working tree based on `e8dd290`; Search application code is unchanged. This commit contains only the readiness helper, its controlled checks, the single geometry navigation binding and evidence. Full final-head CI remains separate from this local proof. Functional tests do not grant visual, business or deployment acceptance.

## Reproduction

Use the existing compiled Playwright configuration and disposable synthetic database. Node 24.21.0, Playwright 1.63.0, Chrome 154.0.8037.98, PostgreSQL 16 on Windows. The compiled application was built from the LC-17 working tree; Search application bytes are unchanged from `e8dd290`.

```sh
npx playwright test -c playwright.compiled.config.ts tests/browser/sales-followup.spec.ts tests/browser/leads.spec.ts tests/browser/projects-gantt.spec.ts tests/browser/crm.spec.ts tests/browser/search-navigation.spec.ts tests/browser/sh-platform.spec.ts --grep "LC-17|LC-11|Projects navigation|CA-01/04/13|search geometry|search readiness|SH review perspectives" --project desktop-chromium --project mobile-chromium --no-deps
```

The [manifest](manifest.json) hashes staged source and retained evidence bytes. It does not certify the uncommitted LC-17 application or replace fresh CI on the repair commit.

Retained text copies normalise line endings and trailing whitespace; screenshots are unchanged.
