# Project calendar and actual-date execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Scope: PJ-03 / BC-02, PRJ-02/04/07, AT-09/32. Synthetic verification only; visual review, business acceptance, merge and deployment remain separate.

Source base: `1bb0cc26899a1a1a29da53349df77f8f115d9be0` (PR #461, retaining #458 in its ancestry). Delivery: [PR #466](https://github.com/deanrfiedler-gif/powerplants-one/pull/466), based on #461. Contract: [project calendars and actuals](../../../decisions/project-calendars-actuals.md). New technology, operational calendars and external connections are not introduced.

## Verification contract

- `tests/unit/project-calendars.test.ts`: independent expected working-day counts, leap/DST dates, working Saturday/holiday overrides, sparse weeks with 366 exceptions, limits, FS/SS semantics and strict inputs.
- `tests/database/project-programme.test.ts`: native writes, immutable originals, status/actual disagreement, baseline calendar retention, concurrency, stale versions, correction/withdrawal, current scoped authority, rollback, populated 0087 upgrade and repeated migration/seeding.
- `tests/database/project-acceptance.test.ts`: genuine PJ-09 closeout retains original calendar/actual recovery and refuses new revisions after closure.
- `tests/http/project-programme.test.ts`: compiled routes, exact replay, comparisons, strict query/body validation and denied scope.
- `scripts/projects-restart-proof.ts`: calendar/actual rows, projections and original receipts across application-process and PostgreSQL restarts alongside existing receiving/RAID proofs.
- Historical upgrade suites retain their original full-row ledgers and exact additions. Products adds reserved 0052 after integrated 0088. Hosted upgrade retains the explicit reviewed-version gate and adds no grants/users/seeds.

## Execution

Runtime source: `15577d5577faa97b6dce237f30ebf52e29fd749c`. The subsequent `a9dd21eab13376f294c3fbfe940118584c9f5119` contains test fixture setup changes, the reviewed Contacts source pin and browser captures; it changes no application or migration bytes. [Execution ledger](execution.json) records source pins, outcomes and retained failed attempts. All local database commands retain the existing 120,000 ms test deadline and application connection/statement limits.

The [complete Projects CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38328357398) passes on runtime source `15577d5`: all 775 application unit tests, 38 scoped database cases, six compiled HTTP cases, real PostgreSQL/application-process restart, five React layout cases and seven desktop/phone journeys (including warm-up). Static assurance and production build pass in the same Ubuntu 24.04 job. The later fixture setup changes also pass locally; the Contacts pin correction is verified separately below. Final-head PR CI remains a separate record.

| Verification | Result |
|---|---|
| Focused Projects unit tests | 23 pass, including five new working-calendar cases |
| Programme database scenarios C01–C07 | Seven pass in 104.4 seconds overall: revisions, forecasts, baseline retention, racing writes, scoped authority, exact deferred evidence, rollback, populated 0087 upgrade and bounded history |
| Genuine PJ-09 project closeout | Pass: original calendar/actual commands and receipts recover after closeout, while new revisions are refused; exact issued documents and independent Service/commercial decisions remain in the journey |
| Compiled calendar/actual HTTP routes | Two pass, including a full 366-exception Unicode payload within the explicit bounded body size |
| Compiled desktop and phone consumers | Both journeys and the shared route warm-up pass; calendar warnings, baseline copy and history labels verified |
| PostgreSQL plus application-process restart | Pass: exact calendar/actual rows, reads and original receipts retained alongside existing receiving, RAID, portfolio and overview assertions |
| Reserved Products 0052 after integrated 0088 | Pass: original rows and exact new duties preserved; repeated migration/seeding inert |
| Static/build assurance | TypeScript, ESLint, production build, foundation and naming checks pass |
| Live design register | Zero errors: 358 entries, 43 components, 21 runnable states; 330 unreviewed and 28 stale reviews remain visible |
| Contacts dependency | Deterministic issued HTML unchanged (SHA-256 `aa97680dadf459aa6fbeaf39c761df124adf6737fb68c62b106589c38eac9a52`); 103 model groups and 62 native Chrome browser groups pass |

Local execution uses Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63 and Chrome 155.0.8059.40, with only `ppo_synthetic_test`. Credentials and environment files remain outside Git. Desktop and phone captures are [desktop](calendar-desktop.png) and [phone](calendar-phone.png); these are synthetic functional checks, not paired owner visual acceptance.

## Retained failures and repairs

The initial six-case database run passed C01–C03 but C04–C06 exceeded the unchanged deadline. A focused retry passed C07, while C05 timed out and C06 failed connection acquisition during concurrent full-row snapshots. The harness now resets once for distinct-project cases, restores exact grants in `finally`, and snapshots the historical tables serially. The populated-upgrade case still reconstructs its own 0087 database and compares every original row and ledger entry. Assertions, deadlines and production pool settings were not weakened. The first consolidated attempt failed in the initial reset hook; its subsequent complete run passes all seven cases.

The unchanged-main control at `c3ff5b90d0730f55583b6ee73f9d1af4a449695e` passes its original baseline persistence/reset test in 56.5 seconds overall. Its first archive lacked public font assets and failed setup; that incomplete control is not counted as a product result. An independent read-only main connection also passes. These results do not establish that every earlier failure was environmental.

The first type check caught the intentionally pinned hosted-demo version gate; the additive migration was reviewed before advancing it. CI at `15577d5` also refused the changed Projects source hash in the Contacts design. The [contract re-read](../../../design/contacts/README.md#project-programme-contract-re-read--13-october-2026) verifies that Person visibility, external affiliations and `owner_unavailable` are unchanged; only the working pin is refreshed. Issued HTML and historical build/browser evidence remain unchanged.

## Remaining boundaries

The existing Gantt consumes calendar-aware warnings and names the selected calendar. Calendar/actual-date editing surfaces are API-only; weekend shading and bar geometry remain calendar based. Exact new editing-state mockups and paired visual/device acceptance are not claimed.

Broader effort/resource planning, lag, critical-path calculation, automatic rescheduling and operational calendar approval remain separate. Full final-head PR CI, independent review, merge and deployment are separate from the local results above.
