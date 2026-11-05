# Activity list read evidence — 5 November 2026

This is the bounded performance correction in [PR #862](https://github.com/deanrfiedler-gif/powerplants-one/pull/862), following [Claude's measurement on #707](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6652225470) and [separate-fix decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6653541191). Implementation choices are Codex decisions under the standing order. No merge, deployment, owner acceptance or independent review is claimed.

## Read design and authority

`src/activities/activities.ts` selects the authorised page's complete Activity rows and owner names using the existing visibility predicate, filters, ID ordering, limit-plus-one and signed cursor. One client serves the page. One page-ID-keyed links query uses the same Organisation, Site, Asset, Ticket, Opportunity, Lead and Project predicates as direct reads. An unavailable target refuses the read rather than silently removing a link.

`src/activities/page-reads.ts` groups the remaining native detail SELECTs by SQL shape. Identical pending parameters share one lookup; different parameters become one parameterised `UNION ALL` statement, with an internal slot removed before returning each result. PostgreSQL still decodes its native column types, including timestamps. Dependent lookup waves execute serially on the page client. Nothing is cached across waves, pages or principals. All native reads drain before the client is released, including failure paths.

The existing required-evidence, incident, report, escalation and edit-authority readers still decide their fields; none is dropped. The page-authorised Activity context is supplied to the legacy finding guard, which retains source/appointment/equipment scope and context matching without re-running the page Activity's visibility query. Independent source Activities used by escalation authority still receive their native check. Direct Activity reads and mutation authority retain their normal path. No schema, capability, grant, dependency, API-shape or existing test-expectation change is made. Customer 360's optional per-record `permitted()` optimisation is outside this change.

The diagnostic allowlist now recognises `/api/v1/customers/:id/workspace`, and sanitisation preserves the literal `workspace` route segment while removing the record identity and query string.

## Equivalence proof

`tests/database/activity-list.test.ts` compares full list DTOs with independent `readActivity` calls for every currently visible ID in order. It exercises coordinator, site observer, assigned technician and company-B coordinator, different owners, native crew assignments, multi-target and cross-site links, company-B records, required evidence, a native scheduling finding, an escalation-associated chase, source-capability revocation, shared-read revocation and a selected working company. It checks the whole page and three-row continuation pages, the final cursor and refusal of another principal's cursor. A second test compares a full 100-row page and the final one-row continuation against direct reads, and asserts one pool acquisition for the full page.

The chase association is a synthetic retained fixture on a native case, not evidence of sending a manufacturer message or rendering a pack. Existing Activity, My Work, Customer 360 and source-workflow tests are unchanged. `tests/unit/activity-page-reads.test.ts` checks slot/parameter mapping, empty results, date preservation, no later-result cache, failure propagation, serial dependent waves and diagnostic path sanitisation.

During construction, the new test incorrectly assumed the seed already contained a company-B Activity, and matched a cursor error against its safe general message. Both failures reproduced using the same new test against unmodified main. The fixture now explicitly creates a company-B Activity and asserts the existing cursor field error. Neither correction changes an existing test or runtime behaviour.

## Same-data measurement

[Machine-readable results](measurements.json) retain timestamps and PostgreSQL phase counts. Baseline: main `3faff7aef476904a30e878be8bdc9e95792fb4fb`. Environment: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 in the disposable `ppo_synthetic_test` database. The main seed is supplemented with exactly 100 coordinator-owned RestrictedService CustomerContact Activities linked to Organisation `50000000-0000-4000-8000-000000000001` and Site `70000000-0000-4000-8000-000000000001`, with summaries `SYN activity batch measurement 1` through `100` and no due date.

Warm each compiled route once, then reset and seed the exact fixture again. Pin each application server and PostgreSQL to CPU 0, enable PostgreSQL `log_min_duration_statement=0`, create the coordinator session outside the timed interval, and issue one `GET /api/v1/customers/50000000-0000-4000-8000-000000000001/workspace` to each implementation, serially on the unchanged business data. Sum PostgreSQL parse, bind, execute and simple-statement durations whose timestamps fall inside each GET. Count an execute or a simple statement once; parse/bind lines are reported separately and are not extra executed statements. Restore logging and CPU affinity afterwards. This uses the compiled-server, single-core and database-log method in Claude's evidence. The only between-read writes are synthetic session metadata outside the measured intervals.

Both responses return 100 Activities and are deep-equal after removing only the `observed_at` fields. The machine-readable record retains the common normalised DTO SHA-256.

| Local sample | Before | After |
| --- | ---: | ---: |
| Returned activities | 100 | 100 |
| Summed database time | 36,927.062 ms | 217.498 ms |
| Executed statements | 2,817 | 134 |
| PostgreSQL duration log entries | 6,445 | 382 |
| Workspace-call wall time | 2,982.314 ms | 350.441 ms |

Database time drops 99.4%, and executed statements 95.2%. Summed database time can exceed wall time because the original uses concurrent pool queries. This is one local compiled-HTTP sample per implementation after warm-up, with SQL logging enabled and each server plus PostgreSQL pinned to CPU 0; it does not establish a hosted, ten-user or whole-application target.

## Validation

The mandated cloud setup succeeded: PostgreSQL ready, browser unavailable. Foundation, prototype, naming, status, migrations and 44 documentation unit checks passed. `npm run studio:check` and `npm run check` passed, including lint, typecheck, all 1,405 unit tests and the compiled application build. After main advanced to `3368ab66295a9e7fed7d0f3708b4150315110d9f`, a conflict-free merge-only commit retained this PR's exact stable patch ID. The merged-tree foundation, prototype, naming, status and documentation-scope checks passed; `npm run check` passed again with all 1,410 unit tests and the compiled build. Sandbox `EPERM` failures were rerun successfully with network access as instructed.

The selected database run passed 81 of 92 tests; all 11 failures reproduced on clean main with identical missing-Chrome or `RenderOrStorageFailure` messages. [Each test and classification](database-results.json) is retained. The final two-test equivalence rerun, including the one-client assertion, passed.

`npm run test:http` passed 90 of 113 shared-group tests. All 23 failures reproduced with the same messages against clean main's compiled server. [Each failure and classification](http-results.json) is retained: explicit rendering errors are **environment-blocked: browser**; indirect fixture and assertion errors are **pre-existing on main in this environment**. The unchanged runner exits at that point, so its 33 exclusive files were **not run here; left to GitHub CI**. The main comparison SHA is `3faff7aef476904a30e878be8bdc9e95792fb4fb` for both database and HTTP evidence.

Local browser suites, ready-head compiled-application and P01–P11 browser checks, including intake in desktop-1 and mobile-1: **not run here; left to GitHub CI**. The PR remains draft: the new-PR instruction requires every check to pass before marking ready, and these local runs are not all green. Claude's one review has not yet been requested. Functional proof, rendered application proof, independent review and owner acceptance remain separate.
