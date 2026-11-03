---
title: Cloud setup creates the synthetic document store as 0700
date: 2026-11-03
---

In a Claude Code cloud workspace (writable home, umask 0022), `scripts/cloud-setup.sh` failed at `npm run db:seed` with `ExactDocumentUnavailable` ("The exact document version is unavailable…"). It created `~/.ppo-synthetic-documents` with `mkdir -p`, giving mode 0755, and `LocalSyntheticDocumentStore` in `src/documents/store.ts` refuses a store folder with any group or other permission bit; its own `mkdir(..., { mode: 0o700 })` does not change a folder that already exists. Seed 6 writes synthetic documents, so seeding failed, and AGENTS.md then treats the database as unavailable for the whole session.

The script now creates the store folder as 0700 and tightens an existing one with `chmod 700`, for the home default, the Codex Cloud fallback beside the tools and a preset `PPO_DOCUMENT_DIRECTORY`. If the home folder cannot hold a private writable store, it still falls back beside the tools; if the chosen folder cannot be made private and writable, the script stops with a message instead of failing later at seeding. The store's permission check is unchanged.

Checked in a Claude Code cloud workspace: `bash -n`; the store block under umask 022 for a new folder, an existing 0755 folder, a preset 0755 directory and an unusable home (all end at 0700, the last beside the tools); and the whole script after dropping the disposable `ppo_synthetic_test` database and setting the store back to 0755, which exited 0 with migrate and seed completed and the store at 0700. Before the change, the same workspace failed at seeding. The browser stayed unavailable because the installed Chrome (153.0.8010.12) is older than the pinned patch; that is separate and not changed here. Not run in Codex Cloud.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.
