---
document_id: PPO-ADR-0024
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Selected P12 implementation design; verification pending
source_commit: d069ea3e0a0e82034bb47e501e1c293d12933cd2
---

# ADR-0024 — Isolated synthetic checkpoint and restore

## Authority and preserved scope

[Issue #165](https://github.com/deanrfiedler-gif/powerplants-one/issues/165) records Dean's continuing audit instruction and verified P11 prerequisite. The [authoritative P11 publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/54#issuecomment-5567364667) is complete for its bounded code/main delivery; latency, physical-device/screen-reader and full PT/owner acceptance limits remain. P12 implements clean restore, compatible originals, deterministic demonstration and a usable runbook under PT-22/PT-28/PT-30. It does not grant Service/Finance approvals or live integration/hosting authority. The independent #163 owns ADR-0022/runtime maintenance; #164 owns ADR-0023/migration 0025. P12 allocates ADR-0024 and initially no database migration.

## Decision

Use the existing TypeScript/Node application and PostgreSQL 16 backup utilities. A private checkpoint contains a complete custom-format database dump, all declared private document/source/media bytes and their exact relative identities, approved non-secret release/configuration provenance, and explicitly selected closed synthetic browser profile data when offline originals are in scope. Backups and profiles stay outside Git and outside public CI review artifacts. Public evidence contains only synthetic scenario IDs, counts, hashes, measured times, tool/runtime identities and classified outcomes.

Checkpointing is an explicit stopped-application/stopped-worker/closed-browser operation. It refuses another source database client, acquires the migration lock and table locks, exports one transaction snapshot, and uses that same snapshot for the database dump and independent table/constraint/migration fingerprints. Private file copies must be stable regular files with no symlink traversal. The private manifest records exact sizes/hashes and the actual checkpoint time. Missing or changed bytes fail the checkpoint; no missing original is regenerated. Secrets and PostgreSQL cluster roles are outside this local synthetic backup contract; business permission grants and audit/receipt records are in the database dump.

Restore requires a **second disposable PostgreSQL instance**, the existing allowed name `ppo_synthetic_test`, a distinct loopback endpoint and a different PostgreSQL system identifier. It refuses any non-empty application destination. The existing local configuration's allowed names, exposure and identity guards are retained. Fresh private document/profile destinations must be outside the repository and different from all source/checkpoint paths. Restore uses a single transaction with failure-on-error; object ownership/ACLs are assigned to the local restore owner, while application permission-grant rows and all business originals remain exact. No production, hosted, in-place or operational restore is supported.

Prefer installed matching PostgreSQL 16 utilities. In the existing disposable CI, the already declared `postgres:16.15` image may supply the same client programs as a one-shot process; it is not a new hosted service or deployment. The isolated test instance uses that same pinned engine. No arbitrary shell command or connection string appears in logs or generated review evidence. Direct argument arrays and private process environment carry connection settings.

Before starting an application or worker against the destination, compare all table counts/content digests, sequence state, constraints and migration ledger, plus every declared original file/profile byte. Record actual restore duration and the checkpoint-to-simulated-loss interval. Keep every unknown Finance target fenced for its existing original-operation lookup/reconciliation; never blanket-reset outbox states, release consumed quantities or dispatch possibly accepted originals. Lease recovery uses current typed recovery paths and original operations after current-authority checks. Simulation is enabled only deliberately after inspection; real outbound adapters remain unavailable.

A restored synthetic browser profile must preserve pending and accepted schema-1 originals, exact PNG bytes, receipts and unsupported originals under their original owner. Closing/copying a dedicated profile is a backup mechanism, not an API for reading another user's local data. Reopening still requires existing ownership/current-identity checks. Browser profile credentials and recovery capabilities must not enter review artifacts. Native profile portability is bounded to the tested browser/platform; no physical-device or cross-machine browser-format guarantee follows.

## Alternatives and limits

Restarting the original database cannot prove restoration. SQL row exports omit constraints, functions, sequences and migration history. Regenerating issued documents destroys evidence. Restoring into the source or a different database in the same cluster weakens isolation; use a new instance. A new backup service/framework adds no necessary capability to this local synthetic increment. A production PITR, encrypted operational device recovery, offsite retention and promised RPO/RTO require separate infrastructure and decisions.

PostgreSQL documents consistent single-database dumps and portable custom archives; pg_restore reconstructs the archived objects. These tools do not by themselves checkpoint external files or browser stores, so the explicit quiescence, complete manifest and independent restore comparison are part of this application contract. [pg_dump 16](https://www.postgresql.org/docs/16/app-pgdump.html) · [pg_restore 16](https://www.postgresql.org/docs/16/app-pgrestore.html), checked 14 September 2026.

## Verification and delivery

Prove refusal of source/same-instance/non-empty/remote/ambiguous targets, tampered or missing files, incompatible migration/code versions and unsafe paths before destructive work. Exercise a real dump into a clean second instance, exact file restoration, lease recovery and original unknown-result lookup without duplicate issue/target. Retain supported and unsupported offline originals across the compatible application update and isolated restoration. Reuse accepted Service/Finance sources, Travel policy, all template versions and previous restart gates.

Prepare the existing DEMO-02 six-record 2/1/1/1/1 stage distribution through domain commands in a new isolated epoch with idempotent scenario mappings, exact receipts and no old-data relabelling. Preserve estimating owner and quote originals. Record complete applicable PT procedures against their actual written steps; a missing scheduling-policy publication path, physical device, screen reader or owner demonstration is reported explicitly, never treated as a passed component. Full PP-01 acceptance and owner approval remain distinct from bounded repository delivery. Normal expected-head merges and actual-main verification complete the authorised handover; no workflow permission or branch-protection bypass is introduced.
