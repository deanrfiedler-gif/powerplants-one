# Scheduling-policy persistence verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 28 September 2026. Scope: Step 2 of the [controlled publication plan](../../../delivery/scheduling-policy-publication-plan.md). Source self-review, independent review, owner acceptance and production readiness remain separate.

## Baseline and allocation

Origin main was refreshed to `a9840183f1510f5677cf95547d9849454e35ec2f`; GitHub confirmed [#327](https://github.com/deanrfiedler-gif/powerplants-one/pull/327) merged with all checks successful. No PR was open at preflight. This contribution uses `codex/scheduling-policy-persistence` in an isolated worktree. The root's dirty planning/reference files, unfinished Maintenance/Products/Excel worktrees and earlier private proof databases were preserved.

A new private loopback PostgreSQL 16.15 cluster was initialized on port 55764, containing only `ppo_synthetic_test`. The actual registered schema through 0050 was applied before inspection. Live `scheduling_policies`, `activities`, `activity_links`, `operation_receipts`, `appointment_revisions`, immutable functions and privileges were examined, including later amendments. The policy remains Published-only, synthetic, immutable and requires the three fixed contact/crew flags. Activity uses a typed Site link; a separate typed impact companion supplies the new relationship. Receipt `record_id` requires a business identity.

**0053 is the implemented migration.** Existing 0049/0050 bytes remain unchanged; 0016, 0051 Maintenance/Warranty and 0052 Products remain absent/reserved. Seed 53 is registered after seed 49 against the actual migration. The local and hosted runners apply missing registered entries. No placeholder or unfinished predecessor was added. Later 0051/0052 owners must prove both ascending installation and application after an installed 0053.

## Enforced storage and server boundary

| Invariant | Enforcement |
|---|---|
| Workspace/family/root, exact source policy version/hash and source chain position | Workspace-qualified FKs, immutable family/member rows, proposal binding trigger and Step 1 validation. Family-head version is separate from policy-row version; tests use head 2 with policy row version 7. |
| Immutable proposal revisions and reviews | Existing `immutable_evidence()` convention rejects UPDATE/DELETE; exact predecessor/version/hash and actor FKs. Review retains proposal/source/head, schema/evaluator, event and observation instant. |
| Complete saved reviewed population | Every candidate, including compliant rows, has a typed immutable child. Deferred comparison requires the exact ordered parent array and refuses omitted or extra children. The database cannot establish that a later loader queried every eligible booking. |
| Canonical content | Unchanged Step 1 `canonical`/SHA-256 modules validate before insert and on reads. Store unsigned canonical UTF-8 text, parsed JSONB and digest. PostgreSQL verifies that text parses to the stored JSON and hashes to the supplied digest; it does not implement JavaScript canonicalization or replace it with JSONB text. |
| Publication lineage/head | Unique predecessor, successor, proposal, review, publication/member and chain position; strictly later effective instant and unchanged fixed terms. Head starts at the trusted root, advances one position and cannot rewind/delete. Deferred checks require the final latest head. |
| Original publication operation | Exact actor/operation/receipt FK, canonical command/hash including command name/schema version, publication identity, saved policy/review/proposal bindings and receipt record/version/state/time. Receipt `task_ids` retains its outbox meaning; impact Activities are resolved through typed companions. |
| Impact/task graph | One immutable affected snapshot per publication/booking; snapshot exactly matches its reviewed candidate. Every affected candidate requires an impact and typed Activity companion at commit. Existing Site link, company, site, reviewed owner, Task/TechnicalFollowUp and RestrictedService context are checked at attachment. |
| Resolution evidence | Append-only numbered events, exact impact hash, booking identity/version, actor/operation, schema/evaluator, reason, observation and dependencies; typed optional replacement and nonbranching predecessor. Activity completion creates no resolution. |

Only publication gains a global business identity, because the existing receipt FK requires one. No proposal, review, impact or resolution identity is introduced. The migration flushes `identity_target` immediately before the identity CHECK extension and restores deferred mode afterwards. It adds no capability, user, grant, audit/outbox enum, route or live command. The hosted generic runtime table grants remain subject to immutable/deferred constraints; users/permission grants remain unwritable by the runtime role.

The bootstrap is an explicit trusted seed-root exception around `a0000000-0000-4000-8000-000000000001`. It creates no historic proposal, review or publication, changes no policy bytes or booking pin, and uses insert-only conflict preservation for an advanced head. Runtime permissions are not business approval.

The internal [adapter](../../../../src/scheduling/policy-persistence.ts) validates proposal/review writes against saved server records and reconstructs historic chain prefixes on reads. Its population parameter must be independently enumerated server evidence. It provides no permission decision, current population loader, business evaluator, workspace graph lock or command receipt orchestration. The [SQL fixture helper](../../../../tests/helpers/policy-persistence.ts) is confined to tests and is not an operational publisher.

## Executed checks

The [PostgreSQL suite](../../../../tests/database/policy-persistence.test.ts) covers populated-0050 upgrade, fresh install with reserved gaps, repeated migration/seed, complete canonical round trips, immutable revisions/evidence, cross-workspace/actor/source/hash substitution, missing compliant candidates, lineage/head/refused branches, typed tasks, duplicate impacts, original bindings, staged rollback, runtime privileges and advanced-head/revocation preservation. Existing Estimating upgrade suites exercise pending identities across 0026 with saved estimates/quotes; the hosted upgrade suite creates its actual identity prerequisites in the disposable environment.

Validation is in progress. Final results and source pins will be recorded before PR handover.

Earlier failures remain distinct: initial SQL parsing needed parentheses around a CASE expression; the first population trigger used a CASE referencing a field absent on the parent row type and was corrected to an IF; the first fixture assumed two Confirmed seed bookings and now adds a non-overlapping constrained synthetic booking; the first advanced-head preservation snapshot preceded fixture creation and now follows it. No existing assertion, skip or performance limit was relaxed. The first build refused an external node_modules junction; an isolated locked install replaces that local setup. An overloaded parallel unit invocation recorded three CLI/launcher timeouts in addition to the four Windows failures; the subsequent sequential run has 561 passes and only those four Windows failures. Clean unchanged-main `a9840183` reproduces the four failures (document store twice, recovery private-path and Windows route separator); its CLI/launcher comparison passes all 13 cases.

## Limits and next increment

These tests prove database persistence, structural integrity and rollback of synthetic SQL fixture transactions. They do not prove publication authorization, current complete booking evaluation, original HTTP recovery, guarded command atomicity/concurrency, dispatch/start/offline enforcement, browser acceptance or owner approval. Resolution evidence is not itself an operational release of a hold, and a current disposition must be freshly evaluated by later commands. No deployment or external business action occurred.

Step 3 must introduce the narrow review/publish authorities, complete scoped server population/evaluator, shared workspace graph locking, current reviewer/owner eligibility, exact original recovery, audit/EVT-12 and guarded review/publication/resolution commands. It must connect the stored original publication envelope to the actual public API contract rather than invent another hash algorithm. Later Steps 4/5 retain booking selection, readiness/offline enforcement and UI obligations. An older application cannot safely enforce holds after operational publication is introduced; additive schema compatibility alone does not establish that rollback safety. PT-28/PT-30, PT-27 misses and independent owner/device/accessibility acceptance remain open.

Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28 and AT-35. All 78 parent IDs and issued source references are preserved. MYOB, SharePoint and native CAD retain their existing authority.
