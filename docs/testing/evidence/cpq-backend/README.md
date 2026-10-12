# Native CPQ backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026 (Australia/Brisbane). Review: implementation verification; visual and operational acceptance separate. Initial source baseline: `ae83043`; implementation branch: `codex/cpq-native`. [Decision](../../../decisions/cpq-native-runtime.md), [delivery plan](../../../delivery/cpq-backend-plan.md), [API handover](../../../interfaces/cpq-api.md).

## Executed scope

The immutable-release, independent review/publication, deterministic calculation and native estimate adoption core. The plan identifies later enterprise scope explicitly. No application page or Figma change, merge, deployment, production migration or provider transaction was performed.

Windows, Node 24.21.0, locked dependencies, PostgreSQL 16 and a task-owned disposable `ppo_synthetic_test` database with loopback synthetic identity. No test records or credentials are retained here. Private logs and configuration remain outside Git. The [source manifest](source-manifest.json) pins the evaluated implementation. Rebase onto `383041a` preserved every CPQ runtime/test byte and retained the newly merged review-queue documentation.

## Passed checks

- Focused unit selection: **27 passed**, including ten CPQ cases plus native arithmetic, costing/workspace validation, migration registry and access roles. Exact fractions resolve before quantity rounding; materials feed labour by declared part unit. Typed unknowns, conflicts, price validity, overrides, bounded expressions and isolated worker execution are covered.
- **All six distinct CPQ database scenarios passed across focused runs**: independent release governance and revoked recovery; failing fixtures/revision invalidation; immutable calculations and atomic adoption/replay with customer quotation projection; preserved manual costs and stale estimates; blocked calculations, changed activation and forced transaction rollback; populated 0085→0086 migration/seed repeatability without grants or historical changes. The final regression selection repeated governance and adoption successfully after the nullable display-reference change. This is not a claim that a single six-case invocation completed without a setup timeout.
- HTTP integration: **one complete multi-endpoint scenario passed** against the local Next application, covering all eleven CPQ route handlers, isolated fixtures/calculation, release/review/activation, exact replay, run reads/history/comparison, adoption/recovery, stale post-adoption preview, cross-company denial, revoked duty, strict input/query validation, foreign origin and private/no-store responses. Native discovery fixtures are created through existing services; every CPQ action uses HTTP.
- TypeScript, ESLint, generated access-review model, development-register, foundation and naming checks passed during implementation; the rebased implementation also passed TypeScript, the ten CPQ unit cases, the generated access model, the development register and naming checks. Existing design reviews remain unaccepted: the register reports 330 unreviewed and 28 stale entries, with zero schema errors.

## Corrections and local limits

An initial reset exceeded the disposable PostgreSQL cluster's default lock capacity. The task-owned cluster was configured with additional lock capacity; application schema and assertions were unchanged. A later beforeEach reset exceeded the existing test deadline while broad unit/build work competed for memory. The affected governance case passed separately; no timeout was relaxed.

The first HTTP attempt preceded listener readiness. The next exposed a real integration error: Next tried to bundle the worker's TypeScript loader and esbuild binary. `tsx` is now explicitly external in Next configuration; the complete HTTP release and calculation/adoption scenarios passed afterward. No new package was added.

A full unit attempt and production build were interrupted under local memory pressure. Existing operator CLI timeouts occurred during that overloaded unit attempt; they have not been attributed to this change or claimed as baseline failures. The targeted tests passed. A full local unit result and completed production build are not claimed. Full CI remains necessary before merge, particularly the historical upgrade matrix and compiled runtime checks.

## PR verification follow-up

The complete six-case CPQ database suite passed in one clean serial invocation on 12 October: 6 passed, 0 failed, 285.4 seconds, with the existing 120-second per-case deadline unchanged. This supersedes the earlier split-run qualification. It covers the populated 0085 upgrade and repeated seeding as well as the five runtime scenarios above.

On original PR head `bac5bce`, [Estimating CI run 38245718752](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38245718752) completed its Static and unit proof, production compilation and existing compiled HTTP steps successfully. Those steps resolve the earlier local build/full-unit uncertainty on Linux; they do not claim that the entire workflow or final PR head has passed. The strengthened Estimating workflow explicitly includes the CPQ database suite and complete CPQ HTTP test against the compiled application. Final CI status is recorded on PR #453; no merge is authorised.

PR #450 subsequently advanced main to `fe7794b` while verification was running. The CPQ branch was rebased to retain the Quotations reads, tests and both document-register additions. CPQ runtime, tests, migration and compiled-test wiring are byte-identical to the verified `a83a656` tree; the only shared test reconciliation appends migration 0086 while preserving all Quotations assertions. Before that update, [compiled Estimating job 114802515668](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38246597927/job/114802515668) passed its full job, including all 19 direct HTTP tests and the CPQ scenario. Final combined-head CI supersedes the earlier runs.

PR head `c21a44d` completed all 17 workflows successfully: 55 checks passed, with only the optional PT-27 controlled comparison skipped. All seven protected-main checks passed. Its [Estimating database job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38249316769/job/114812116761) passed 757 unit tests and 129 database cases, including all six CPQ scenarios in one invocation. Its [compiled Estimating job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38249316769/job/114812116323) passed all 20 direct HTTP tests including CPQ. All four general application database groups and the desktop/mobile browser suites also passed.

PR #451 advanced main to `2bbbcb3` as that verification finished. The branch was rebased again on 13 October (Australia/Brisbane), preserving both STATUS contributions and all Leads implementation/tests. CPQ runtime, tests, migration and compiled-test wiring remain byte-identical to `c21a44d`; only the integration documentation needed manual reconciliation. Final combined-head CI is recorded on PR #453 without treating earlier-head results as a substitute.

PR #452 subsequently advanced main to `ba7d4b1`. The next rebase retained both document-register additions, all Lead record code/tests and the exact migration-0086 ledger extension in the shared Leads/Projects test. CPQ runtime/test bytes are unchanged. Before that update, intermediate head `40b10ba` passed 757 unit tests, [all 129 Estimating database cases including six CPQ cases](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38261343077/job/114852333692), and [all 20 compiled HTTP cases including CPQ](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38261343077/job/114852333423). Its remaining general application runs were superseded; only final-head CI establishes completion after this integration.

## Remaining acceptance

UI integration/accessibility, operational facts and approved price/labour sources, performance/scale targets, durable calculation jobs, advanced commercial policy, global constraint solving, CAD/ERP integrations and customer-safe channels remain in the delivery plan. Synthetic passing fixtures do not constitute engineering, pricing, security-owner or business acceptance.
