# Excel import validated upload and review evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Scope:** synthetic backend preview only. Base main `65141dcb8a3e39f6516f69955e8260ed447d152b`; branch `codex/excel-import-review-backend`. [Decision](../../../decisions/excel-import-review-backend.md), [API](../../../contracts/excel-import-review.md).

## Execution

Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and Windows. A dedicated loopback cluster on port 55426 runs only disposable `ppo_synthetic_test`; no hosted service is involved. Generated OOXML fixtures reuse the retained 12-line/seven-section synthetic example, rebinding exact permitted native context in a generated copy. Issued fixture bytes remain unchanged.

- Parser and review units: 54/54 pass. Covers exact 62,952.38 cost and 85,607.63 sell, original rows/formula evidence, offsetting discrepancies, independent unknown aggregates, missing/duplicate/orphan keys, typed precision/choices, scope/area mismatches, source validity, zero/one/100/101 rows, receiving size, dates, archive/XML adversarial inputs and unsupported content.
- Database: all four cases pass (three in the complete run, then the corrected permission fixture's focused rerun). Exact replay and an existing saved estimate preserve full business rows, grants, receipts, audit and outbox. Wrong company/working company, permitted non-owner, revoked read/edit/shared access, stale scope/context/estimate, malformed payloads and package failures are refused.
- Compiled HTTP: one connected scenario passes through the actual Next.js build, including both endpoints, exact totals, replay, domain issues, private/no-store responses, missing authentication, cross-origin and foreign-company refusals, streamed envelope limit, stale revision and no business writes.
- Full application build including TypeScript passes. Standalone typecheck also passes after route-type regeneration. Changed-source ESLint and Git whitespace checks pass.
- Foundation, PP-01 and naming checks pass: all 78 parent IDs retained; 9,476 local links; project instructions 7,978 characters. Studio integrity passes with 362 entries, 46 components and 208 routes. Its existing 334 unreviewed and 28 stale entries remain separate from this backend proof.

The first database run exposed that the native Draft-group guard obtains a SELECT FOR UPDATE lock and cannot run in a PostgreSQL READ ONLY transaction. The preview now uses a short repeatable-read transaction with the existing native guard, then releases it before parsing and acquires fresh authority afterwards. Full business-row snapshots assert the preview creates no database effects. A subsequent non-owner fixture attempted an ownership rewrite that the database correctly forbids; it now gives another real actor explicit test duties and proves ownership refusal without changing the owner. No constraint or permission assertion was weakened.

Initial typecheck encountered stale generated Next route types from the previous DK-06 branch. Regenerating route types for this independent main-based branch resolved those errors; no retained source or domain behaviour was changed to suppress them.

The user interruption stopped an initial build and disposable database process. PostgreSQL completed crash recovery; attempts during recovery reported connection/startup refusals. The completed build, database proofs and compiled HTTP scenario above ran afterwards. These interruption/startup results are not application regressions. The full repository unit/database/browser suites were not rerun locally; the existing estimating and application CI workflows include the new tests. There is no new native page.

## Limits

This is a backend increment without a native page. No workbook source, approval, estimate, receipt, audit or outbox effect is persisted. Restart/source-recovery, commit/rollback, persisted line identities, re-import, customer-output and UI/device acceptance belong to later increments. Generated synthetic OOXML is not proof against an actual Excel-produced operational workbook. Independent review, owner acceptance, PR CI, merge and deployment are separate.
