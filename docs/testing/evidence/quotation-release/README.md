# ES-05 synthetic quotation release evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 3 October 2026. Runtime source: `ea67777b35fa5cd347da45fc2b3ef33d612ec4bd`, stacked on ES-04 PR #338. [PR #340](https://github.com/deanrfiedler-gif/powerplants-one/pull/340), [contract](../../../contracts/quotation-release.md), [handover](../../../delivery/quotation-release-handover.md).

The [manifest](manifest.json) records exact runtime file hashes, compiled build ID, original inspected capture hashes and restart preservation. The runtime was Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and Chrome 154.0.8037.97 on Windows. All data and adapters were synthetic. Destructive database suites used a separate disposable `ppo_synthetic_test`; restart originals were retained in another isolated instance.

## Executed checks

| Boundary | Actual result |
|---|---|
| ES-05 PostgreSQL | Final combined run: 10/10 pass, including exact bytes, duties, concurrency, rollback, stored-render recovery, explicit successor, captured-recipient revocation and populated 0058 upgrade |
| Cross-module and hosted upgrades | 25 distinct cases pass: 17 initially, four repaired exact expectations plus four older Estimating/Finance cases in the eight-case rerun. All required migration-ledger consumers and exact new grants are covered |
| Compiled direct HTTP | Six cases pass across E1, ES-04 and ES-05; strict schema, current permissions, no-store reads, original replay and exact file access |
| Compiled browser | 25 pass across E1/ES-04/ES-05 on desktop and mobile; seven final ES-05/warm-up cases replay successfully after strengthening capture readiness |
| Actual restart | Separate application and PostgreSQL processes restarted. All 23 captured rows, four original release command replays and four original Draft/release HTML/PDF files remain identical |
| Full unit suite | 571 pass / 4 fail. The four failures reproduce on unchanged main `6e8b898`; the isolated baseline run has 3 pass / the same 4 fail |
| Build and static | Final compiled build/type check, lint, foundation, prototype, naming and studio pass. Studio: 328 entries, 174 routes, 35 component records, 19 runnable examples; reviews remain pending |
| AD-01 | 107 model groups and 40 Chrome groups pass with the exact 111-capability contract |

The Windows baseline failures are the two private document-store directory cases, P12 private recovery-directory classification and repository-relative warm-route separators. No original assertion or storage guard was weakened. The unchanged detached main checkout was clean before comparison.

Initial new database fixtures had SQL type/qualification/order errors and omitted person-company context; direct opportunity mutation was correctly refused by the existing audit guard. The corrected fixture uses the existing information-edit service. Initial cross-module assertions omitted seed 59 and the two precise local user IDs; the exact additions are now asserted. The first overview screenshot captured loading; the test now awaits the saved document load. These are corrected contribution/setup defects, not attributed to main.

## Reproduction

Use the repository's private synthetic environment and pinned renderer; never print or commit credentials. Run these database groups serially on the disposable test database:

```text
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/quotation-release.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern="upgrade|fresh combined|existing Leads|original Gantt|fresh installation|already-current demo|conflicting Gantt|late privilege" tests/database/field.test.ts tests/database/finance-upgrade.test.ts tests/database/offline.test.ts tests/database/packs.test.ts tests/database/planner.test.ts tests/database/reports.test.ts tests/database/field-timer-boundaries.test.ts tests/database/policy-persistence.test.ts tests/database/leads-projects-integration.test.ts tests/database/quality-upgrade.test.ts tests/demo/upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern="fresh combined|main 0017|existing Leads|populated 0050|migration formalises|current-main upgrade|migration 24|P10 arrival" tests/database/leads-projects-integration.test.ts tests/database/policy-persistence.test.ts tests/database/estimating.test.ts tests/database/estimating-workspaces.test.ts tests/database/finance-upgrade.test.ts
npm run build
node --env-file=.env.local --import tsx --test tests/http/estimating.test.ts tests/http/estimating-review.test.ts tests/http/quotation-release.test.ts
npx playwright test --config=playwright.compiled.config.ts tests/browser/estimating.spec.ts tests/browser/estimating-review.spec.ts tests/browser/quotation-release.spec.ts
node --env-file=.env.local --import tsx scripts/quotation-release-restart.ts write
# Restart the actual application and its isolated PostgreSQL instance.
node --env-file=.env.local --import tsx scripts/quotation-release-restart.ts verify
```

HTTP/restart commands require the compiled loopback application and `PPO_TEST_ORIGIN` matching it. Browser replay also sets `PPO_PORT` and `PPO_TEST_ORIGIN` to that application. The Estimating assurance workflow now runs the new database, HTTP, browser and restart proofs in CI.

## Visual disposition

Codex inspected the original 1440×1000 [issued desktop](issued-desktop.png), 390×844 [phone overview](issued-phone.png) and 320×844 [changed-basis disclosure](changed-basis-320.png) captures. Controls and long hashes wrap; the four stages remain separate. Automated checks cover 1024/390/320 widths and removal of protected evidence after refusal.

This is bounded agent inspection. There are no accepted paired native reference screenshots. The unchanged ES-05 r02 reference retains its separate design role. Owner acceptance, physical devices, screen readers and 200% browser zoom remain open. UUID-heavy expanded history remains a usability limitation. No accepted review fingerprint was inserted in the design register.

## Programme limit

The verified path ends at exact synthetic issue and separately recorded distribution simulation. ES-06 exact response/correction and ES-07 independently received handover/conversion remain the next concrete increments. The output has no commercial validity; there is no customer send, live provider, ERP transaction, merge or deployment.
