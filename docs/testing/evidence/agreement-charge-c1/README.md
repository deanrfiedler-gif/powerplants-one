# Agreement charge C1 backend evidence

[PPO-MAINTENANCE-TS02-DEC](../../../decisions/maintenance-service-ts02-decisions.md) C, [PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905). One-level stack on M2 #904 sequences Finance source/contract edits; B3 is merged. No merge, deployment or live data action is implied.

## Scope and provenance

Migration 0127 was reserved and pushed before writing it. The normal reservation command could not enumerate open PRs because shell `gh` GraphQL returned Forbidden. The GitHub connector enumerated all four open PRs (897, 902, 904, 905) and every changed filename; none claimed a migration. The existing reservation module then ran with that observed empty remote-claim set, creating `db/reservations/0127.md`. The implementation removes its reservation. The tracked reservation/checker scripts were not changed to bypass a check.

The optional exact schedule preserves old agreement payload/hash bytes. New charge-bearing revisions require independent Finance approval. Immutable projected charges and exact source/account snapshots feed the existing Finance holds, review, processing, unknown-result lookup and reconciliation. SQL guards preserve the old WorkOrder/ProjectClaim branches and enforce a disjoint source/hold shape. No new seed, capability, grant, dependency or customer output.

All new money/date fixtures are synthetic. AUD 4,800.00 annual advance and AUD 1,200.25 later charge are independent expected values; no tax or FX is calculated. Tests grant explicit test-only maintenance source read to the preparer/processor, not a product seed or operational delegation. A user lacking that existing source authority cannot use or retrieve agreement claims.

## Executed verification

Results are recorded after final execution. Five focused database cases cover exact source/target cents, returned holds/revised transfer, duplicate/concurrent claims, safe cancellation, unknown-outcome protection, historical lookup/reconciliation after withdrawal, original-operation recovery, due/approval/currentness, cross-agreement refusal, direct SQL source guards, source revocation and queue exclusion. Unit cases cover default dates, absent historical schedules and invalid money/identity/date/policy inputs.

The first focused run passed three cases and found two fixture/assertion defects: a replay assertion compared the transport `replayed` flag rather than the unchanged receipt, and a reused fixture inserted an existing test-only grant twice. Both were corrected; no production behavior changed for those findings. The complete five-case corrected run passed.

Cloud setup for M2 supplied Node 24.21.0/npm 11.19.0/PostgreSQL 16.15. C1 uses the same configured tools and separate worktree, with database suites sequenced after M2. Chrome is absent, confirmed by the M2 browser probe. Document-producing ProjectClaim/upgrade fixtures explicitly use `project-claims-synthetic-renderer.mjs` only on disposable `ppo_synthetic_test`; these are command/persistence proofs, not real PDF evidence. The new C1 focused cases need no renderer; the helper was loaded during that run but no agreement output was rendered.

Full CI, independent Claude review, native UI/output, complete TS-01/02 acceptance, operational agreement/rate/tax authority and real ERP remain separate. No actual MYOB document type or number is claimed.
