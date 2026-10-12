# Native CPQ backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026 (Australia/Brisbane). Review: implementation verification; visual and operational acceptance separate. Initial source baseline: `ae83043`; implementation branch: `codex/cpq-native`. [Decision](../../../decisions/cpq-native-runtime.md), [delivery plan](../../../delivery/cpq-backend-plan.md), [API handover](../../../interfaces/cpq-api.md).

## Executed scope

The immutable-release, independent review/publication, deterministic calculation and native estimate adoption core. The plan identifies later enterprise scope explicitly. No application page or Figma change, merge, deployment, production migration or provider transaction was performed.

Windows, Node 24.21.0, locked dependencies, PostgreSQL 16 and a task-owned disposable `ppo_synthetic_test` database with loopback synthetic identity. No test records or credentials are retained here. Private logs and configuration remain outside Git.

## Passed checks

- Focused unit selection: **27 passed**, including ten CPQ cases plus native arithmetic, costing/workspace validation, migration registry and access roles. Exact fractions resolve before quantity rounding; materials feed labour by declared part unit. Typed unknowns, conflicts, price validity, overrides, bounded expressions and isolated worker execution are covered.
- **All six distinct CPQ database scenarios passed across focused runs**: independent release governance and revoked recovery; failing fixtures/revision invalidation; immutable calculations and atomic adoption/replay with customer quotation projection; preserved manual costs and stale estimates; blocked calculations, changed activation and forced transaction rollback; populated 0085→0086 migration/seed repeatability without grants or historical changes. The final regression selection repeated governance and adoption successfully after the nullable display-reference change. This is not a claim that a single six-case invocation completed without a setup timeout.
- HTTP integration: **one complete multi-endpoint scenario passed** against the local Next application, covering all eleven CPQ route handlers, isolated fixtures/calculation, release/review/activation, exact replay, run reads/history/comparison, adoption/recovery, stale post-adoption preview, cross-company denial, revoked duty, strict input/query validation, foreign origin and private/no-store responses. Native discovery fixtures are created through existing services; every CPQ action uses HTTP.
- TypeScript, ESLint, generated access-review model, development-register, foundation and naming checks passed during implementation; final head results are recorded in the PR. Existing design reviews remain unaccepted: the register reports 330 unreviewed and 28 stale entries, with zero schema errors.

## Corrections and local limits

An initial reset exceeded the disposable PostgreSQL cluster's default lock capacity. The task-owned cluster was configured with additional lock capacity; application schema and assertions were unchanged. A later beforeEach reset exceeded the existing test deadline while broad unit/build work competed for memory. The affected governance case passed separately; no timeout was relaxed.

The first HTTP attempt preceded listener readiness. The next exposed a real integration error: Next tried to bundle the worker's TypeScript loader and esbuild binary. `tsx` is now explicitly external in Next configuration; the complete HTTP release and calculation/adoption scenarios passed afterward. No new package was added.

A full unit attempt and production build were interrupted under local memory pressure. Existing operator CLI timeouts occurred during that overloaded unit attempt; they have not been attributed to this change or claimed as baseline failures. The targeted tests passed. A full local unit result and completed production build are not claimed. Full CI remains necessary before merge, particularly the historical upgrade matrix and compiled runtime checks.

## Remaining acceptance

UI integration/accessibility, operational facts and approved price/labour sources, performance/scale targets, durable calculation jobs, advanced commercial policy, global constraint solving, CAD/ERP integrations and customer-safe channels remain in the delivery plan. Synthetic passing fixtures do not constitute engineering, pricing, security-owner or business acceptance.
