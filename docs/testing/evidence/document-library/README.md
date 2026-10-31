# DK-01/DK-02 backend execution evidence

Owner: Dean Fiedler. Branch: `codex/document-library-backend`, based on `a4b55fc531e8d6b377221144bf987f100198caf8` from dependent Projects PR #466. Scope: synthetic Document Register, Linked Library and Revision/Review backend. Independent review, accepted native UI, owner acceptance, merge and deployment are separate.

Contract: [architecture and boundaries](../../../decisions/document-library-backend.md), [API](../../../contracts/document-library.md). Migration 0090 in the combined #463 release (0089 in the source evidence below), no seed/user/grant additions, three default-denied document capabilities, DOC identity. Issued reference bytes and parent IDs are preserved.

## Combined release integration

The combined #463 candidate includes Projects calendar 0088 and CPQ 0089 before the unchanged library SQL at 0090. Source-bound results below retain their original migration numbering and hashes. The combined upgrade proof now retains populated 0088 rows and populated 0089 CPQ drafts/history, verifies both identity types after 0090, and preserves original ledgers on repeat migration/seed. Fresh candidate CI is recorded on #463; earlier evidence is not relabelled as final-head proof.

## Verification ledger

Runtime/test source: `a15c5f40cc5a3a3b0c3b8b7e394136d68ed03f5f`, carried by [PR #467](https://github.com/deanrfiedler-gif/powerplants-one/pull/467). Later handover-only edits do not change this tested source. The [execution manifest](execution.json) pins the source and normalised LF hashes. The [complete library CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38338584316) passed on that source, including compiled HTTP and a real PostgreSQL/application-process restart. Broader final-head PR checks, independent review, owner acceptance, merge and deployment remain separate. Local environment: Windows, Node 24.21.0/npm 11.19.0, PostgreSQL 16.15, disposable `ppo_synthetic_test`, existing private synthetic document store and pinned browser renderer. CI uses Ubuntu 24.04 with the same Node/npm/PostgreSQL versions and disposable database. Test and application timeouts remain unchanged.

- Initial TypeScript check found missing native capability labels and create/revise parser narrowing. Corrected.
- First database run: 0/9. Eight cases stopped at an incorrect site-to-organisation assumption; the live model uses site-party relationships. The populated-upgrade test also named a nonexistent calendar table. Corrected against current schema.
- Isolated first end-to-end case then passed: creation, independent review, original receipt, revision, retained reference, exact historic bytes and withdrawal.
- Second run passed the first four cases; added evidence hardening exposed a PL/pgSQL CASE expression requiring parentheses while later resets read the updated migration. Corrected; fresh migration parse passed. These runs are diagnostic, not final-source proof.
- Third database run passed 9/10, including native PDFs and populated/repeated upgrade. The last test fixture omitted the site_id companion on its Site grant; corrected to the existing scope contract. Additional exact source-author and storage-before-database-failure proofs were then added.
- A combined local check ran all 775 existing units: 772 passed, three failed in Windows private-path/symlink tests. The same three failures reproduce in an unchanged `origin/main` archive at `ad9f2eb42285f46329d2ef138e6f635d369bacfa`. A canonical temporary directory gets past the short-path refusal but reaches Windows EPERM on symlink creation. No guard or test expectation was weakened.
- Concurrent local units/build pressure coincided with 120-second reset-hook failures in the final database batch; six cases passed before it was stopped. The subsequent isolated final run passed all 11 cases in 684.94 seconds, with the unchanged deadlines and no concurrent local build/unit run. This does not establish the cause of every earlier timeout.
- The first full compiled build passed. A scoped inverse linked-record read was then added; the final local build and current-source compiled API CI proof now pass.
- Generated AD-01 capability model: 107 groups passed with 145 capabilities. Visual acceptance is not inferred.

## Current-source results

- Document Library database: **11/11 passed**, including source-author independence, exact native PDFs, populated/repeated upgrade, scoped inverse link reads, date-only findings, and storage success followed by database rollback and exact retry.
- Products historical upgrades: **2/2 passed**, from 0025 across deferred identity backfills and reserved 0052 installation after 0089. Original rows, receipts, grants and ledgers remain checked; repeat migration/seed is inert.
- Final local typecheck, lint and full production build: passed. Full `npm run check` also passed in the library CI run, including **775/775 unit tests**, studio integrity and the compiled build. The three local Windows baseline unit failures above remain recorded.
- Compiled HTTP: **2/2 passed in CI**, covering strict commands, independent review, original receipts, exact historical links, the inverse linked-record route and protected download headers.
- Real PostgreSQL restart and fresh application process: **passed in CI**. [Retained result](restart-result.json) records exact original bytes, review/history, original receipts and unchanged migration ledger. Local HTTP/restart duplicates were not needed after the complete current-source CI proof passed.
- [AD-01 catalogue CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38338584415): passed on the same source, including the generated 145-capability catalogue, 107 model groups and **40 native browser groups**. CI uses Chrome 155.0.8059.39; local model checks also pass. This does not grant visual acceptance.
- The [existing DK-01/DK-02 design model/browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38338584296) also passed on the same source. Its standalone design remains separate from native page implementation.
- Earlier repository assurance: foundation, naming and studio integrity passed. Studio reports 330 unreviewed entries, 28 stale entries and 43 components still needing review; these are not promoted to accepted.
- The attempted unchanged-main reset control lacked `public/brand/Roboto-variable.ttf` in its partial archive. That setup failure is not a product result or a timeout regression control. The unchanged-main three-unit-failure comparison above is a separate completed control.

## Exercised coverage

`tests/database/document-library.test.ts` covers persisted lifecycle, review independence, findings, source/currentness and link scope, missing-byte recovery, stale/racing commands, retained evidence and populated/repeated upgrade. `tests/http/document-library.test.ts` exercises compiled routes, strict commands, exact download headers and original receipts. `scripts/document-library-restart-proof.ts` checks exact bytes, decisions, history, receipts and migration ledger in a separate process after PostgreSQL restart. Products upgrade cases from 0025 and after 0089 prove pending identity events and reserved migration 0052 installation.

## Remaining boundary

Native workspace/visual review, live SharePoint, arbitrary uploads, CAD comparison, automatic impact actions, DK-03 controlled publication/distribution, DK-06 template publication, operational approval and deployment are not delivered by this increment. Audience text is descriptive; document grants and native source authority enforce visibility. No hosted tester receives the new permissions by default.

## Native workspace continuation — 31 October 2026

PR #706 now implements the accepted DK-01/DK-02 routes. See the [native workspace ledger](workspace/README.md) for current screenshots, execution and limitations. The source-bound backend evidence above remains unchanged; it is not relabelled as proof of the new UI.
