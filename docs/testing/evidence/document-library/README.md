# DK-01/DK-02 backend execution evidence

Owner: Dean Fiedler. Branch: `codex/document-library-backend`, based on `a4b55fc531e8d6b377221144bf987f100198caf8` from dependent Projects PR #466. Scope: synthetic Document Register, Linked Library and Revision/Review backend. Independent review, accepted native UI, owner acceptance, merge and deployment are separate.

Contract: [architecture and boundaries](../../../decisions/document-library-backend.md), [API](../../../contracts/document-library.md). Migration 0089, no seed/user/grant additions, three default-denied document capabilities, DOC identity. Issued reference bytes and parent IDs are preserved.

## Verification ledger

Execution is in progress. Final source and results will be recorded after the required checks complete. Local environment: Node 24.21.0, PostgreSQL 16.15, disposable `ppo_synthetic_test`, existing private synthetic document store and pinned browser renderer. Test and application timeouts remain unchanged.

- Initial TypeScript check found missing native capability labels and create/revise parser narrowing. Corrected.
- First database run: 0/9. Eight cases stopped at an incorrect site-to-organisation assumption; the live model uses site-party relationships. The populated-upgrade test also named a nonexistent calendar table. Corrected against current schema.
- Isolated first end-to-end case then passed: creation, independent review, original receipt, revision, retained reference, exact historic bytes and withdrawal.
- Second run passed the first four cases; added evidence hardening exposed a PL/pgSQL CASE expression requiring parentheses while later resets read the updated migration. Corrected; fresh migration parse passed. These runs are diagnostic, not final-source proof.
- Third database run passed 9/10, including native PDFs and populated/repeated upgrade. The last test fixture omitted the site_id companion on its Site grant; corrected to the existing scope contract. Additional exact source-author and storage-before-database-failure proofs were then added.
- Generated AD-01 capability model: 107 groups passed with 145 capabilities. Visual acceptance is not inferred.

## Required coverage

`tests/database/document-library.test.ts` covers persisted lifecycle, review independence, findings, source/currentness and link scope, missing-byte recovery, stale/racing commands, retained evidence and populated/repeated upgrade. `tests/http/document-library.test.ts` exercises compiled routes, strict commands, exact download headers and original receipts. `scripts/document-library-restart-proof.ts` checks exact bytes, decisions, history, receipts and migration ledger in a separate process after PostgreSQL restart. Products upgrade cases from 0025 and after 0089 prove pending identity events and reserved migration 0052 installation.

## Remaining boundary

Native workspace/visual review, live SharePoint, arbitrary uploads, CAD comparison, automatic impact actions, DK-03 controlled publication/distribution, DK-06 template publication, operational approval and deployment are not delivered by this increment. Audience text is descriptive; document grants and native source authority enforce visibility. No hosted tester receives the new permissions by default.
