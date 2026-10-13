# DK-03 controlled output actions — execution evidence

Owner: Dean Fiedler. Synthetic backend contribution on `codex/output-actions-backend`, based on PR #468 at `0d61a9432fa7a2f643d40c316e17c6d359e50065`. Review, owner acceptance, merge and deployment remain separate.

Contract: [output actions](../../../contracts/output-actions.md). Decision: [backend increment](../../../decisions/output-actions-backend.md). Preserves DK-03, DOC-01–DOC-06 and OUT-09/OUT-10.

## Verification ledger

Verification in progress; final results are recorded below before handover. Corrected local replays of C03–C05 passed. Final C06/C09, compiled HTTP, restart and complete checks remain pending at this checkpoint. The new tests cover native issue delegation, exact-byte finalisation recovery, scoped per-recipient original recovery, concurrent commands, stale versions, unsupported delivery claims, immutable evidence and rollback, populated 0089 upgrade and real PostgreSQL/application restart. Existing native suites remain regression evidence.

Local environment: private disposable `ppo_synthetic_test`, PostgreSQL 16.15, Node 24.21.0, npm 11.19.0 and pinned Playwright 1.63 renderer. No operational data or external delivery provider is used.

No accepted UI is implemented by this increment. Synthetic sending and reconciliation are labelled observations, not verified transport delivery. Native authority, retained byte recovery and receipt replay stay separate from owner/business acceptance.

## Corrections retained

The first local run passed C01, C02, C07 and C08. C03/C06 exposed a missing extension of the existing outbox-kind constraint; 0090 now additively permits the three distribution events. The first failing concurrent request also left its sibling running because the test used Promise.all; subsequent database reset hooks deadlocked. The proof now settles both requests before teardown. These failures and their corrected replays are kept distinct from acceptance. A single-client concurrent history read was replaced by one batched event query after the driver warned about concurrent queries on that client.

The full local lint pass found one unused import in the new restart proof; it was removed. The first combined historical-upgrade batch exceeded the unchanged 120-second beforeEach setup deadline in DK-B09; no business assertion ran in that case. This setup failure is recorded separately from successful upgrade evidence.
