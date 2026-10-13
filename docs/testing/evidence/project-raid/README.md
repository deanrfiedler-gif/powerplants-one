# Projects RAID backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution date: 13 October 2026. Synthetic local proof; CI, independent review, owner acceptance and deployment are separate.

Contract: [PJ-04 backend](../../../decisions/project-raid-backend.md). Starting main: `7e4ef3b8ce28e1976fea621f9de33999c26fbe21`. Executed runtime and tests: `572f7841e239c85749644760c3b4ff0bfa0b65fd`. [Execution metadata](execution.json) records the runtime/test hashes normalised to LF, not visual-review fingerprints. Later handover edits do not change those sources. [PR #458](https://github.com/deanrfiedler-gif/powerplants-one/pull/458) carries independent CI.

## Passed local checks

- Six new PostgreSQL scenarios cover connected Activity completion, reasoned closure/reopening, history, exact replay and changed-payload refusal, competing revisions, immutable kind/action links, detached-evidence rollback, current Project/Activity/working-company isolation, hidden-source redaction, read-only scope, all five kinds, filtered signed paging and a populated 0086 upgrade to 0087 with exact originals and inert retries.
- Five selected regression cases pass: populated Estimating 0025 upgrade across the 0026 identity backfill; reserved Products 0052 installed after integrated 0087; the native PJ-09 project-closeout journey with new RAID refusal/replay assertions; populated PJ-03 upgrade from 0077; and local hosted-demo upgrade preserving CRM, mailbox, sessions, grants and invitation limits. The latter executes only against this isolated synthetic database.
- Five focused unit checks pass: two RAID validation cases and three migration-registry/checksum cases.
- Two compiled HTTP cases pass: Project creation, native Activity creation/linkage/completion, RAID closure/history/original recovery, scope denial, invalid envelopes/cursors and stale writes.
- `scripts/projects-restart-proof.ts write`, actual PostgreSQL stop/start, and a separate `verify` process pass. Project schedule, RAID current/history, linked Activity and both original-receipt paths survive intact.
- Full TypeScript, full ESLint and production build pass. Design coverage passes with 358 entries, 204 routes, 330 unreviewed and 28 stale reviews; no review fingerprint changes. Foundation and naming checks pass, retaining all 78 parent requirements. Maintained project instructions remain below 8,000 characters.

Environment: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Windows. Existing document-producing regression cases used accepted Chrome 155.0.8059.40. The private test database is `ppo_synthetic_test`. Raw logs and temporary originals remain outside tracked source.

## Actual failures and corrections

The initial typecheck caught the working-company helper's actor-ID signature and an inconsistent migration-version gate; both were corrected. The first six-case database batch ran with the runner's stale latest-version constant (0086), so the new tables were absent. Registering 0087 in both the ordered list and the latest-version constant fixed installation; the entire six-case batch then passed. All historical expected additions were updated without changing original ledgers, grants or users.

The initial design check rejected a `db/` path outside its permitted reference roots. Runtime sources and the decision retain the registration; the migration remains documented in the contract without widening that allowlist. A local authoring encoding issue in the new page-contract paragraph was repaired to UTF-8 before the passing checks. No issued source bytes changed.

The first HTTP attempt preceded compiled-server readiness and received `ECONNREFUSED`; a bounded readiness attempt also expired during startup. After the existing server announced readiness and `/login` returned 200, the same two tests passed. No test assertion, deadline, browser policy or permission boundary was relaxed.

## Remaining boundaries

The native PJ-04 page, browser visual comparison and independent owner/device acceptance are not implemented or claimed. Full unrelated suites are left to their existing CI jobs. The supplied Wrike audit is bounded trial evidence, with exact source provenance in the contract; no account action or raw audit publication occurred. RAID is not yet a whole-project closeout gate. No operational integration, merge or deployment was performed.
