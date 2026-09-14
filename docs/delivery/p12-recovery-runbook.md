---
document_id: PPO-PP01-P12-RUN
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implementation and real restore verification in progress
source_commit: d069ea3e0a0e82034bb47e501e1c293d12933cd2
---

# P12 — Private synthetic recovery runbook

[Issue #165](https://github.com/deanrfiedler-gif/powerplants-one/issues/165) · [ADR-0024](../decisions/ADR-0024-p12-isolated-recovery.md) · [ordered plan](prototype-implementation-plan.md). This is the local stopped-application restore procedure. The current source/main evidence in the eventual PR governs verification; the presence of this file does not mean PT-22/PT-28/PT-30 or owner acceptance has passed.

## Install and identify the release

Use the repository's current `.nvmrc`, `package.json` and lockfile. Run `npm ci`, `npm run check`, then the renderer installation described in the current README. Preserve later runtime maintenance from #163; do not substitute an older browser or runtime to make recovery pass. Copy `.env.example` to private `.env.local` and configure the explicitly local synthetic environment and loopback `ppo_synthetic_test` database. Keep actual credentials outside Git and review artifacts.

For a new empty source only, `npm run db:migrate`, `npm run db:seed` and `npm run db:health` install and check deterministic fixtures. Repeating seed retains existing seed receipts and never refreshes an accepted record or revoked grant. `npm run dev` starts the local application. These are not restore commands.

Record the actual commit/tree, engine, private document location and any dedicated synthetic browser profile. PostgreSQL 16 client tools (`pg_dump` and `pg_restore`) are required. Where the existing disposable Docker environment supplies them, set `PPO_RECOVERY_CLIENT=docker`; the implementation uses the already selected `postgres:16.15` image and private environment values. Native tools are the default. Cluster roles, credentials, browser/platform installation and private environment configuration must be retained independently; application permission-grant rows are included in the checkpoint.

## Create and inspect a checkpoint

1. Stop the application, any separate document worker and all other database clients. Close the dedicated synthetic browser completely. A checkpoint during active capture is not supported. Preserve unsaved forms separately before closing; only completed local storage transactions are durable originals.
2. Set `PPO_DOCUMENT_DIRECTORY` to the existing absolute, owner-only private source store. If offline profile recovery is intended, explicitly set `PPO_RECOVERY_PROFILE_DIRECTORY` to its closed private profile; omitting it means no browser recovery claim. Both must be outside Git, without symlinks, and separate from the new checkpoint path.
3. Set `PPO_RECOVERY_STOPPED=application-worker-browser-stopped`. This records the actual stopped state; it must not be set while a process is running. The command additionally checks database clients, locks migration/writes, uses one exported snapshot and checks file membership and bytes before/after copying.
4. Run the following with a **new, absent** checkpoint directory under a private parent:

```bash
node --env-file=.env.local --import tsx scripts/recovery-command.ts checkpoint /absolute/private/checkpoint
node --env-file=.env.local --import tsx scripts/recovery-command.ts inspect /absolute/private/checkpoint
```

The private checkpoint contains `database.dump`, `checkpoint.json`, `documents/` and, if selected, `profile/`. It includes exact database tables, sequence state, definitions/constraints, migration ledger, audit/outbox/receipts and document/media bytes. Do not upload a dump or profile to GitHub artifacts. A failed/partial checkpoint is retained for investigation and cannot be overwritten by rerunning into that path; choose a new path after resolving the cause. Hashes detect accidental corruption; this tool expects a trusted local checkpoint, not an untrusted SQL archive.

The source may remain stopped for comparison. Do not declare a backup recoverable until the separate restore and all comparisons pass.

## Restore into a second disposable instance

1. Prepare a **different PostgreSQL 16 instance**, loopback only, containing an empty `ppo_synthetic_test` database owned by the local restore user. Use a different local port. The tool checks the PostgreSQL system identifier as well as the endpoint; another address for the source is not a clean restore. It never drops an occupied destination.
2. Keep the destination application/worker/browser stopped. In private configuration set `PPO_RECOVERY_TARGET_DATABASE_URL` to this second instance, `PPO_DOCUMENT_DIRECTORY` to a fresh absent destination and, when the checkpoint contains a profile, `PPO_RECOVERY_PROFILE_DIRECTORY` to a fresh absent profile destination. Keep the original `DATABASE_URL` available for comparison. Source/checkpoint/destination paths must be separate. Keep the stopped acknowledgement set.
3. Run:

```bash
node --env-file=.env.local --import tsx scripts/recovery-command.ts restore /absolute/private/checkpoint
```

The tool first validates the archive, every file hash/size/membership and the migration ledger against this release. It restores in one database transaction, compares independent database fingerprints, and copies/compares original private files. It records measured restore duration and checkpoint age at restore; these are observations, not promised RPO/RTO or proof of the exact last lost event. Workers and outbound effects remain disabled. If file copying or comparison fails after SQL restoration, retain the occupied destination for investigation and choose another clean instance for a new attempt; do not reset it automatically.

4. Inspect unresolved jobs, `OutcomeUnknown` Finance attempts and original receipts before resuming. Switch the private application's `DATABASE_URL` to the verified destination only after comparisons pass; retain the source configuration/checkpoint separately. Run `npm run db:health`. Do not seed or migrate over the restore before comparing it. An explicitly compatible forward migration, when required by a later selected release, is a separate recorded step after original verification.
5. Start `npm run dev` against the verified isolated destination. Keep synthetic mode. Use the original owner's current identity and existing recovery actions. An unknown Finance result requires **original-operation lookup** and Finance reconciliation; no fresh dispatch or release of consumed quantities. A recoverable expired rendering lease uses its original job and stored bundle; a missing original fails visibly rather than being regenerated as if it were the original issue. Inspect current permissions before retrying or reading receipts/files.

## Offline originals and rollback

The integrated restore proof now runs the unchanged six-original P08 capture and accepted-response-loss procedures, then durably adds one supported pending original and one unsupported-version fixture. The checkpoint includes that closed profile. Restoration compares every profile byte before reopening, recovers all six exact original receipts, accepts the supported original once, retains the unsupported original for review, checks original PNG bytes, and exercises the actual saved-workspace lock before an identity change. CI execution of this expanded proof is pending. This component does not claim the separate scheduling-policy publication step of PT-28.

A selected closed profile is copied byte-for-byte before it is opened. On reopening, existing owner verification, expiry and lock rules still apply. Never automatically unlock the cache, change its owner or invent a receipt. Supported schema-1 originals replay with their original IDs/hashes/dependencies; unsupported originals remain retained for review/export. An accepted response lost before local receipt commit must recover that exact server receipt. Cross-platform browser-profile portability, physical-device durability and recovery of evicted/unsaved bytes are not established by a filesystem copy.

Rollback means selecting code that explicitly understands the restored migration/payload/template versions while retaining the accepted originals and outcomes. Never restore an old checkpoint over a database that might already contain a later external effect. Keep a later accepted target fenced and investigate it under its original operation. The utility refuses a ledger that this code cannot identify; it does not downgrade migrations or rewrite stored payloads.

## Reset and owner walkthrough

For an explicitly disposable local test environment only, stop the app and run:

```bash
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
```

Reset intentionally recreates synthetic database fixtures; it is **not recovery**, does not restore browser originals and does not remove the private document store. Use a new demo epoch and the [DEMO-02 six-opportunity recipe](private-prototype-demo.md), preserving exact scenario/operation mappings. The preparer now stores original operation identities before dispatch, advances the six records through the actual domain commands, completes O4's initial Activity, and prepares O2's saved fallback estimate and Ready Draft. Run it only in a new isolated epoch with an empty current pipeline:

```bash
node --env-file=.env.local --import tsx scripts/prepare-owner-demo.ts /absolute/private/demo-epoch YYYY-MM-DD
```

Supply the actual preparation date in Australia/Brisbane. The script freezes relative dates once, preserves the three-category historical data, and deliberately records the new synthetic allowance choices as Product No, Labour No and Freight Yes. These are fictional fixture choices, not inferred flags on historical lines. It retains a private immutable `plan.json` and `quote-original.json`, plus a verified `prepared.json` mapping IDs/references, all 19 original receipts, exact 2/1/1/1/1 stage and five-active/one-complete Activity counts, A$9,900.00/A$12,750.50 totals and quote hashes. Repeating the same plan recovers the exact operations; a changed dataset/date/migration epoch is refused. It never resets a database or overwrites an existing opportunity. A preparation lock prevents concurrent operators; after an actual process crash, first verify that no preparer is running, retain the plan, then remove only that epoch's empty `preparation.lock` directory before retrying. The real restore test verifies preparation twice and refuses an old epoch. Its CI execution and the full owner walkthrough remain pending.

The final owner walkthrough must include the actual return visit/history, exact report/reservation, Finance original lookup/reconciliation, safe restarts and isolated restore. The existing P11 publication and new component checks do not by themselves complete that narrative. Scheduling-policy publication, complete PT-28 compatibility, full PT-30, original desktop/phone/PDF review and Dean's independent demonstration acceptance remain separately evidenced obligations. No hosted rollout, operational restore, ERP/SharePoint action or customer distribution is included.
