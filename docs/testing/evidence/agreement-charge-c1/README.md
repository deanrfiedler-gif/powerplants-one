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

## Historical upgrade and tooling follow-up

The first broader upgrade run passed the new populated-0126 case, the existing populated-0125 case and all eight B3 database scenarios. Its two Maintenance reconstruction cases failed because the fixture attempted to install C1 0127 before the intentionally absent Maintenance 0051. The fixture now defers both dependent migrations 0123/0127, preserves the complete prior ledger and expects exactly 0051/0123/0127 on installation. No migration is skipped in an actual upgrade. The corrected SV08 case and a separate command-only all-row preservation/receipt/idempotency case pass unmocked. The original rendered-output proof keeps its unchanged `pdf.length > 1000` assertion; the short synthetic-byte helper cannot satisfy it. Its baseline comparison and the real-renderer CI boundary are recorded below.

The first compiled build could not resolve Next.js through a shared `node_modules` symlink outside Turbopack's root. Installing the unchanged lockfile into this worktree fixed the environment; the production build then passed. One premature repeat was refused by Next's build lock while that build was still running; no lock was removed. The final sequential build passed on the final application source. Lint, TypeScript, Studio coverage and all 1,452 unit tests passed; this is not reported as a single green initial `npm run check`, whose first build attempt failed on the symlink.

## Final local results

- Studio, lint, final TypeScript and **1,452 unit tests passed**; final production build passed with local installed dependencies.
- **20 selected database cases passed**: five new C1 lifecycle/authority/SQL cases, one new populated-0126 upgrade, eight existing B3 cases, one existing populated-0125 upgrade, three P11 quality upgrades and two corrected late-Maintenance cases. The historical source/output fixtures use the explicit synthetic renderer boundary above; the two final late-Maintenance cases run unmocked without rendering.
- **7/7 existing demo-upgrade cases passed unmocked**, preserving saved CRM/mailbox/session/grant/checksum histories, CRLF ledger compatibility and transactional rollback. No hosted demo was accessed or changed.
- **1/1 compiled HTTP case passed without renderer substitution**, using the ordinary compiled application server: existing Finance create/read/submit/review/process/lookup routes, exact AUD 4,800.00 source amount, original receipt replay, queue visibility and negative cases. The server loads no test module mocks.
- Foundation, prototype, naming, migration numbering, status-source and documentation-scope checks passed; **44 documentation tests passed**. Final source/whitespace checks and CI/review are tracked on the PR.

Full real-renderer database/browser suites remain unrun locally because Chrome is absent. The existing rendered late-Maintenance proof fails its unchanged >1,000-byte PDF assertion under the explicitly short synthetic renderer helper. The independent unmodified-main control is recorded below. This failure is not counted as a passing rendered suite or as evidence against business behavior.

Independent Claude review and full final-head/merged-tree CI are outstanding. C1 must retarget to main after M2 merges; agents do not merge. No full TS-01/02, device/visual, operational financial policy, real MYOB or SharePoint acceptance is claimed.

Unmodified-main control: detached clean main `9926da5fa9a3b60fbc22843d25ddea1af4830bf5` reproduced the same `assert.ok(bytes.pdf.length > 1000)` failure with the same optional synthetic renderer. The C1 branch reaches that same unchanged assertion after its reconstructed-history fix. The separate unmocked command-only late-installation proof passes and does not claim to verify PDF size or layout. No assertion or renderer bytes were relaxed.
