# DK-03 controlled output actions — execution evidence

Owner: Dean Fiedler. Synthetic backend contribution on `codex/output-actions-backend`, based on PR #468 at `0d61a9432fa7a2f643d40c316e17c6d359e50065`. Review, owner acceptance, merge and deployment remain separate.

Contract: [output actions](../../../contracts/output-actions.md). Decision: [backend increment](../../../decisions/output-actions-backend.md). Preserves DK-03, DOC-01–DOC-06 and OUT-09/OUT-10.

## Verification ledger

Local verification completed; CI and integration remain separate. Local execution now covers passing C01–C09, the existing B01 register journey, populated 0088/0089 upgrades and reserved Products installation after versions 25 and 90. Both compiled HTTP cases and the real PostgreSQL/application restart proof passed. The new tests cover native issue delegation, exact-byte finalisation recovery, scoped per-recipient original recovery, concurrent commands, stale versions, unsupported delivery claims, immutable evidence and rollback, populated 0089 upgrade and real PostgreSQL/application restart. Existing native suites remain regression evidence.

Local environment: private disposable `ppo_synthetic_test`, PostgreSQL 16.15, Node 24.21.0, npm 11.19.0 and pinned Playwright 1.63 renderer. No operational data or external delivery provider is used.

No accepted UI is implemented by this increment. Synthetic sending and reconciliation are labelled observations, not verified transport delivery. Native authority, retained byte recovery and receipt replay stay separate from owner/business acceptance.

## Corrections retained

The first local run passed C01, C02, C07 and C08. C03/C06 exposed a missing extension of the existing outbox-kind constraint; 0090 now additively permits the three distribution events. The first failing concurrent request also left its sibling running because the test used Promise.all; subsequent database reset hooks deadlocked. The proof now settles both requests before teardown. These failures and their corrected replays are kept distinct from acceptance. A single-client concurrent history read was replaced by one batched event query after the driver warned about concurrent queries on that client.

The full local lint pass found one unused import in the new restart proof; it was removed. The first combined historical-upgrade batch exceeded the unchanged 120-second beforeEach setup deadline in DK-B09; no business assertion ran in that case. This setup failure is recorded separately from successful upgrade evidence.

## Local broad checks and baseline comparison

Studio integrity passed: 358 entries, 204 routes and no errors; 330 unreviewed entries, 28 stale reviews and 43 pending component reviews remain visible. Foundation and naming checks passed. Full lint identified only the unused restart import noted above; changed-source lint and TypeScript passed after correction.

The broad unit run passed 771 of 777 tests. The two operator-startup checks and local-address subprocess check exceeded their unchanged deadlines under the broad run, then all three passed in isolated execution with the same deadlines. The other three failures (two document-store tests and the P12 private-path test) reproduced in an unmodified main checkout at `4a9d6727979cbe449ec26ebc2ebf413539d55963`: the selected baseline suite passed 15/18 and reported the same three failures. They are existing local Windows filesystem limitations, not changes to their assertions or the application safeguards. No checks or deadlines were relaxed. The baseline checkout was archived after the comparison; no main files were changed.

DK-B09's isolated replay passed with its original deadline, as did the final C09 proof, including retained issue identity and no business writes when issued bytes are unavailable.

## Final bounded proof

Runtime source: `58392248ef658586ab69a54738853026bdf4d760`. Final build passed, including Next compilation and TypeScript. Both compiled HTTP journeys passed against the built application: exact native issue receipts, original render recovery, checked byte availability, synthetic preparation, unknown-outcome blocking, additive reconciliation, original receipt lookup, scoped denial, validation and forged-origin refusal. The local server was stopped after verification.

The write process retained both families, exact issued files, original receipts and unknown recipient attempts. The private PostgreSQL instance was actually restarted, then a new Node process verified original business rows, migration ledger, document identities/hashes and receipts, blocked replacement attempts, and reconciled each original once. [Restart result](restart-result.json) records the bounded outcome. No real sending or delivery was claimed. Full synthetic snapshots and transient logs remain outside the tracked evidence.

## Integration gate

[PR #469](https://github.com/deanrfiedler-gif/powerplants-one/pull/469) depends on #468 and the earlier #467 library contribution. The separate combined release [PR #463](https://github.com/deanrfiedler-gif/powerplants-one/pull/463), inspected at `18b775ff91bf9e09b44450e958e15ec51dd58118`, reserves 0089 for `cpq-design-contract`, while #467 currently uses 0089 for `document-library`. This parent-stack collision must be reconciled and tested before integration. This contribution's 0090 is unoccupied in that inspected candidate; neither candidate nor existing migration bytes were silently rewritten. Keep this PR draft pending coordinated parent migration numbering and combined-source checks. Main merges/deployment remain under the separate release coordinator's hold. CI status is reported independently at handover; no queued run is recorded as a pass.

## Parent integration continuation — 13 October 2026

Dean subsequently authorised resolving and merging the open contributions. Main has published CPQ 0089 and Document Library 0090; Output Distribution is now 0091 with identical SQL bytes. The previous draft hold above describes its original checkpoint. The combined #469 retains #468/#471 by ancestry; exact upgrade assertions and the hosted gate are reconciled. [Current integration evidence](../document-pr-integration/README.md) records validation and remaining gates.
