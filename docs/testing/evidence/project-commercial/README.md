# Project commercial controls execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 14 October 2026 on Windows, Node 24.21.0/npm 11.19.0 and PostgreSQL 16, using synthetic fixtures. [Contract](../../../contracts/project-commercial-controls.md), [Finance definitions](../../../contracts/project-commercial-finance-definitions.md), [handover](../../../delivery/project-commercial-controls-handover.md). Local verification, PR CI, independent review, business acceptance and deployment remain separate.

## Integration and isolation

The managed `codex/pj05-commercial-controls` worktree starts at main `886c9c482c15277b7ab5f997b9567bf272b63070` after the current CPQ turn completed and handed over PR #492. Main was refreshed before publication and remained unchanged. Open CPQ #491/#492 are separate contributions with no new migration or capability. The primary checkout and their worktrees were not changed.

A task-owned PostgreSQL instance on loopback port 55447 runs only `ppo_synthetic_test`; the compiled application listens on 3165. Its lock capacity is 1024, matching repository test provisioning. No shared service was reset/restarted. Credentials and the restart checkpoint (including two local synthetic session cookies) remain outside Git. Migration 0101 was designed from the live amended schema through 0100. No seed, grant, dependency or production service is added. The [source manifest](source-manifest.json) records implementation/test bytes and the compiled build ID; it does not imply that every changed historical-assertion suite ran locally.

## Local verification ledger

| Check | Actual result |
|---|---|
| Focused units | 21/21 pass: commercial, Project baseline/calendar/overview/RAID, Finance, quotation release and response |
| New commercial database and upgrade suites | 10/10 pass, including populated starts at 0025 and 0100, original ledgers/grants/identities/receipts, repeated migration/seeding, exact quote selection, decisions, exposure, concurrency, rollback, drift and access refusal |
| Final pagination privacy and connected native regressions | 12/12 pass: hidden-cursor refusal; Project receiving/overview/Activity; populated Sales 0075, quotation 0058/0059/0060 and Field 0049/0056 upgrades |
| Additional historical controls | Estimating migration-24 populated upgrade and reserved Products upgrade cases from 25 and 101 pass. The latter installs reserved 0052 after integrated history through 0101 |
| Hosted-demo upgrade | 6/6 pass, including preserved revoked grants, runtime privileges, CRLF historical checksums, conflicting ledger refusal, repeat execution and late-failure rollback |
| Compiled HTTP | 8/8 pass: two commercial cases and six existing Project receiving, overview, programme and RAID/Activity cases, in separate fresh database groups |
| Actual application/PostgreSQL restart | Pass: [retained result](restart.json). Both real process IDs changed; the script checks a changed PostgreSQL postmaster start time. All 17 tables remain exact, two original sessions/receipts recover, replay adds no effects and adjusted control value remains 350.10 |
| Build/type/lint | Final production build passes, including TypeScript. Full lint passes; changed final files pass targeted lint. Final standalone typecheck also passes, including the updated restart script |
| AD-01 access catalogue | 107 model groups and 40 browser groups pass; browser errors zero, Chrome 155.0.8059.80. All 153 application capabilities have labels and matching generated hashes |
| Development register | Pass: 362 entries, 47 components, 208 routes, no errors. Existing 334 unreviewed and 28 stale entries remain visible; no visual acceptance inferred |
| Foundation/naming/prototype | Pass: 22 retained issued sources, all 78 parent IDs, 628 registered documents and no errors. Prototype package check also passes |

The new connected fixture deliberately creates a 720.00 estimate but issues only 350.00 of selected quotation scope. Commercial original value must be 350.00. Fixed expected variation values include approved +12000.00, approved adjustment -2000.00, pending requested 7000.00 versus priced 6500.00, disputed 3000.00 later revised to 2800.00, and unknown versus explicit zero. Approved changes total 10000.00 and the adjusted synthetic control value is 10350.00. Proposed date impact leaves the saved Project schedule unchanged.

The database tests also prove independently reviewed sources and decisions, immutable approved originals, same-operation recovery, changed-payload conflict, competing originals, current source/root/Finance duties, cross-company refusal, retained Activity links and terminal action requirements, independently waived obligations, future notice refusal and notice correction chains. A late injected audit failure rolls back the complete commercial identity/event/receipt graph. Current source change holds new approval and adjusted totals while permitted original receipts remain exact. Losing quote authority hides the breakdown and record identifiers.

## Reproduction

Use the repository-pinned Node/npm and a disposable local configuration targeting `ppo_synthetic_test`. Never use shared or operational resources. Tests requiring PDF output use the existing supported document renderer/browser.

```powershell
node --import tsx --test tests/unit/project-commercial.test.ts tests/unit/project-baselines.test.ts tests/unit/project-calendars.test.ts tests/unit/project-overview.test.ts tests/unit/project-raid.test.ts tests/unit/finance.test.ts tests/unit/quotation-release.test.ts tests/unit/quotation-response.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/project-commercial.test.ts tests/database/project-commercial-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-name-pattern='PJ05-05|^PJ02-|^PJ01-|populated.*upgrade|additive.*upgrade' tests/database/project-commercial.test.ts tests/database/project-overview.test.ts tests/database/sales-delivery-binding.test.ts tests/database/quotation-release.test.ts tests/database/quotation-response.test.ts tests/database/quotation-conversion.test.ts tests/database/field-timer-boundaries.test.ts tests/database/field-customer-response.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/demo/upgrade.test.ts
```

The compiled HTTP groups each start with a fresh disposable reset. The restart script takes `write` or `verify` plus an absolute checkpoint path outside Git; between phases stop/start both the actual compiled application and PostgreSQL. Verification requires a changed postmaster start time, unchanged retained SQL graph and original receipt recovery/replay. The Projects workflow performs this sequence and uploads only the compact result.

## Corrections, limits and outstanding acceptance

Initial migration/test iterations corrected a JSON containment expression, fixture command placement and a declined-source test's expected denial code. A declined quotation is unavailable (404); the test now asserts that exact refusal. Final review found that native signed page tokens are encoded rather than encrypted: the commercial list now scans permitted records before choosing a visible cursor anchor, and a revoked-source regression proves no hidden ID appears in a token. This final read change was rebuilt and retested. Initial default PostgreSQL lock capacity was raised only on the task-owned instance to the repository's configured value before upgrade proof.

The first restart verification correctly detected two new login audit events created by the proof helper. The corrected proof retains the original private synthetic sessions and passed a repeated actual restart without new sign-ins; the complete audit table remains in the comparison. An initial readiness probe ran before the compiled server finished starting. The combined restart shell command was blocked by automatic review; explicit verified task-process and PostgreSQL-path commands were allowed.

No unresolved environment failure has been classified as a regression or waived in this ledger. The whole repository unit/database/browser matrix was not run locally; relevant suites and CI coverage are identified explicitly. Unchanged-main comparison is required if a suspected environment failure occurs; none remains in the recorded passing checks.

Native PJ-05/FN-06 pages remain unbuilt and their visual references/reviews remain open. This delivers only the exact accepted-quotation/Sales-receiving/document-based commercial backend and synthetic Finance definitions. Independent-order and multiple-contract bases, owner transfer, reconciliation of a changed original basis, separate notice attachments/links, accounting measures, live integrations and operational/legal decisions remain outside this increment. No customer notice, transaction, merge or deployment was performed.
